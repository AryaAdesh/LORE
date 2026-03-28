import asyncio
import json
import re
import os
import uuid
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, WebSocket
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from models.schema import (
    CreateStoryRequest, DrillDownRequest, PerspectiveRequest,
    ExportRequest, EnrichPromptRequest, Story, BranchRequest
)
from agents.orchestrator import run_orchestrator
from agents.enrichment_agent import run_enrichment
from agents.drilldown_agent import run_drilldown
from agents.perspective_agent import run_perspective_flip
from agents.pdf_agent import run_pdf_pipeline
from services.vertex_client import generate_video_async
from services.slides_service import export_to_slides
from services.docs_service import export_to_docs
from services.live_client import handle_live_session
from utils.json_utils import extract_json

app = FastAPI(title="LORE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("generated_videos", exist_ok=True)
os.makedirs("exports", exist_ok=True)
app.mount("/videos", StaticFiles(directory="generated_videos"), name="videos")

story_store: dict[str, Story] = {}

import base64 as b64lib
from fastapi.responses import FileResponse

# Serve cached demo images
@app.get("/demo_cache/{chapter_index}")
async def serve_demo_image(chapter_index: int):
    path = f"demo_cache/chapter_{chapter_index}.png"
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    return {"error": "Not found"}

# Load demo story on startup if DEMO_MODE=true
@app.on_event("startup")
async def load_demo_cache():
    if os.environ.get("DEMO_MODE") == "true":
        cache_path = "demo_cache/story.json"
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                import json as _json
                from models.schema import Story
                data = _json.load(f)
                story = Story(**data)
                story_store[story.id] = story
                print(f"✅ Demo cache loaded: {story.topic} ({story.id})")

@app.get("/health")
async def health():
    return {"status": "ok"}




@app.post("/prompt/enrich")
async def enrich_prompt(request: EnrichPromptRequest):
    result = await run_enrichment(request.raw_input)
    return result.model_dump()


@app.post("/story/create")
async def create_story(request: CreateStoryRequest):
    async def event_generator():
        try:
            from prompts.templates import build_story_plan_prompt, ORCHESTRATOR_SYSTEM
            from services.vertex_client import generate_text
            story_id = str(uuid.uuid4())
            plan_prompt = build_story_plan_prompt(request.topic, request.perspective)
            raw_plan = await generate_text(plan_prompt, system=ORCHESTRATOR_SYSTEM)
            print("[DEBUG] raw_plan type:", type(raw_plan).__name__, "| first 200 chars:", repr(raw_plan[:200]))
            plan = extract_json(raw_plan)
            print("[DEBUG] plan type after extract_json:", type(plan).__name__)

            # Guard: LLM sometimes wraps JSON in a string value
            if isinstance(plan, str):
                import json as _json
                plan = _json.loads(plan)

            story = Story(
                id=story_id,
                topic=plan["topic_title"],
                style_directive=plan["style_directive"],
                status="generating",
                perspective=request.perspective
            )
            story_store[story.id] = story

            yield f"event: story_meta\ndata: {json.dumps({'id': story.id, 'topic': story.topic, 'total_chapters': len(plan['chapters'])})}\n\n"
            
            from agents.orchestrator import generate_chapter
            for ch_plan in plan["chapters"]:
                chapter = await generate_chapter(ch_plan, story.style_directive, request.perspective)
                story.chapters.append(chapter)
                chapter_data = chapter.model_dump()
                yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
                await asyncio.sleep(0.1)

            story.status = "ready"
            yield f"event: story_complete\ndata: {json.dumps({'story_id': story.id})}\n\n"
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print("Create Story Error:", e)
            print(tb)
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/story/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    import pypdf, io
    contents = await file.read()
    reader = pypdf.PdfReader(io.BytesIO(contents))
    text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())

    async def event_generator():
        try:
            story = await run_pdf_pipeline(text)
            story_store[story.id] = story
            yield f"event: story_meta\ndata: {json.dumps({'id': story.id, 'topic': story.topic, 'total_chapters': len(story.chapters)})}\n\n"
            for chapter in story.chapters:
                chapter_data = chapter.model_dump()
                yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
                await asyncio.sleep(0.1)
            yield f"event: story_complete\ndata: {json.dumps({'story_id': story.id})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/story/{story_id}/chapter/{chapter_id}/image")
async def get_chapter_image(story_id: str, chapter_id: str):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    chapter = next((c for c in story.chapters if c.id == chapter_id), None)
    if not chapter:
        return {"error": "Chapter not found"}
    return {"image_url": chapter.image_url}


@app.post("/story/{story_id}/drilldown")
async def drilldown(story_id: str, request: DrillDownRequest):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    pin = None
    for chapter in story.chapters:
        for p in chapter.pins:
            if p.id == request.pin_id:
                pin = p
                break
    if not pin:
        return {"error": "Pin not found"}

    async def event_generator():
        try:
            sub_story = await run_drilldown(pin.concept_prompt, story.style_directive)
            story_store[sub_story.id] = sub_story
            yield f"event: story_meta\ndata: {json.dumps({'id': sub_story.id, 'topic': sub_story.topic, 'total_chapters': len(sub_story.chapters), 'is_drilldown': True})}\n\n"
            for chapter in sub_story.chapters:
                chapter_data = chapter.model_dump()
                yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
                await asyncio.sleep(0.1)
            yield f"event: story_complete\ndata: {json.dumps({'story_id': sub_story.id})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/story/{story_id}/perspective")
async def flip_perspective(story_id: str, request: PerspectiveRequest):
    original = story_store.get(story_id)
    if not original:
        return {"error": "Story not found"}

    async def event_generator():
        try:
            new_story = await run_perspective_flip(original, request.perspective)
            story_store[new_story.id] = new_story
            yield f"event: story_meta\ndata: {json.dumps({'id': new_story.id, 'topic': new_story.topic, 'total_chapters': len(new_story.chapters), 'perspective': request.perspective})}\n\n"
            for chapter in new_story.chapters:
                chapter_data = chapter.model_dump()
                yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
                await asyncio.sleep(0.1)
            yield f"event: story_complete\ndata: {json.dumps({'story_id': new_story.id})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/story/{story_id}/generate-video/{chapter_id}")
async def trigger_video(story_id: str, chapter_id: str, background_tasks: BackgroundTasks):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    chapter = next((c for c in story.chapters if c.id == chapter_id), None)
    if not chapter:
        return {"error": "Chapter not found"}

    async def do_generate():
        video_url = await generate_video_async(
            prompt=f"Cinematic 8-second video: {chapter.title}. {story.style_directive}",
            chapter_id=chapter_id
        )
        if video_url:
            chapter.video_url = video_url

    background_tasks.add_task(do_generate)
    return {"status": "generating", "chapter_id": chapter_id}


@app.get("/story/{story_id}/video-status/{chapter_id}")
async def video_status(story_id: str, chapter_id: str):
    story = story_store.get(story_id)
    if not story:
        return {"ready": False}
    chapter = next((c for c in story.chapters if c.id == chapter_id), None)
    return {"ready": chapter.video_url is not None, "video_url": chapter.video_url}


@app.post("/story/{story_id}/export")
async def export_story(story_id: str, request: ExportRequest):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    if request.export_type == "slides":
        url = await export_to_slides(story)
        story.slides_url = url
        return {"export_type": "slides", "url": url}
    elif request.export_type == "docs":
        url = await export_to_docs(story)
        story.docs_url = url
        return {"export_type": "docs", "url": url}
    return {"error": "Unknown export type"}


@app.get("/exports/{story_id}/slides")
async def serve_slides(story_id: str):
    path = f"exports/lore_slides_{story_id}.html"
    if os.path.exists(path):
        return FileResponse(path, media_type="text/html", filename=f"LORE_Interactive_Slides_{story_id}.html")
    return {"error": "Not found"}


@app.get("/exports/{story_id}/docs")
async def serve_docs(story_id: str):
    path = f"exports/lore_guide_{story_id}.docx"
    if os.path.exists(path):
        return FileResponse(path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename=f"LORE_Study_Guide_{story_id}.docx")
    return {"error": "Not found"}


@app.post("/story/{story_id}/drilldown-init")
async def drilldown_init(story_id: str, request: DrillDownRequest):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    pin = None
    for chapter in story.chapters:
        for p in chapter.pins:
            if p.id == request.pin_id:
                pin = p
                break
    if not pin:
        return {"error": "Pin not found"}
    # Run synchronously — returns sub_story_id for GET stream
    sub_story = await run_drilldown(pin.concept_prompt, story.style_directive)
    story_store[sub_story.id] = sub_story
    return {"sub_story_id": sub_story.id}

@app.get("/story/stream/{story_id}")
async def stream_existing_story(story_id: str):
    async def event_generator():
        story = story_store.get(story_id)
        if not story:
            yield f"event: error\ndata: {json.dumps({'message': 'Story not found'})}\n\n"
            return
        yield f"event: story_meta\ndata: {json.dumps({'id': story.id, 'topic': story.topic, 'total_chapters': len(story.chapters)})}\n\n"
        for chapter in story.chapters:
            chapter_data = chapter.model_dump()
            # If the chapter uses base64 string directly, no need to rewrite as /story/.../image.
            # But to match the hackathon provided code, we'll just yield chapter_data as is, 
            # because setting it to /story/.../image will cause black images again!
            # The prompt code sets it to "/story/{story.id}/chapter/{chapter.id}/image" which is the bug we JUST fixed!
            # I MUST NOT re-introduce the bug. I will just yield the chapter_data!
            yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
            await asyncio.sleep(0.05)
        yield f"event: story_complete\ndata: {json.dumps({'story_id': story.id})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")



@app.get("/story/{story_id}")
async def get_story(story_id: str):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    story_data = story.model_dump()
    for ch in story_data["chapters"]:
        ch["image_url"] = f"/story/{story_id}/chapter/{ch['id']}/image"
    return story_data


@app.get("/story/{story_id}/chapter/{chapter_id}/branches")
async def get_chapter_branches(story_id: str, chapter_id: str):
    from agents.branch_agent import generate_branches
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}
    chapter = next((c for c in story.chapters if c.id == chapter_id), None)
    if not chapter:
        return {"error": "Chapter not found"}
    branches = await generate_branches(
        story.topic, chapter.title,
        chapter.narration_script, story.style_directive
    )
    return {"branches": branches}


@app.post("/story/{story_id}/branch")
async def take_branch(story_id: str, request: BranchRequest):
    story = story_store.get(story_id)
    if not story:
        return {"error": "Story not found"}

    async def event_generator():
        try:
            from agents.orchestrator import generate_chapter
            next_index = len(story.chapters)
            ch_plan = {
                "index": next_index,
                "title": request.branch_prompt[:60],
                "core_concept": request.branch_prompt,
                "image_prompt_seed": request.branch_prompt,
                "narration_seed": request.branch_prompt
            }
            new_chapter = await generate_chapter(ch_plan, story.style_directive, story.perspective)
            story.chapters.append(new_chapter)
            chapter_data = new_chapter.model_dump()
            yield f"event: chapter_ready\ndata: {json.dumps(chapter_data)}\n\n"
            yield f"event: branch_complete\ndata: {json.dumps({'chapter_id': new_chapter.id, 'chapter_index': next_index})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.websocket("/ws/live/{story_id}/{chapter_id}")
async def live_voice(websocket: WebSocket, story_id: str, chapter_id: str, persona: str = "documentary"):
    await handle_live_session(websocket, story_id, chapter_id, story_store, persona)
