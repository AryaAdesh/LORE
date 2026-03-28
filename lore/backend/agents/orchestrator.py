import json
import asyncio
from utils.json_utils import extract_json
from services.vertex_client import generate_text, generate_image
from prompts.templates import (
    ORCHESTRATOR_SYSTEM, NARRATION_SYSTEM, PIN_ANALYZER_SYSTEM,
    build_story_plan_prompt, build_narration_prompt, build_image_prompt, build_pin_prompt
)
from models.schema import Story, Chapter, SpatialPin, StoryStatus
import uuid

async def run_orchestrator(topic: str, perspective: str = None) -> Story:
    story_id = str(uuid.uuid4())
    plan_prompt = build_story_plan_prompt(topic, perspective)
    raw_plan = await generate_text(plan_prompt, system=ORCHESTRATOR_SYSTEM)
    plan = extract_json(raw_plan)

    story = Story(
        id=story_id,
        topic=plan["topic_title"],
        style_directive=plan["style_directive"],
        status=StoryStatus.GENERATING,
        perspective=perspective
    )

    for ch_plan in plan["chapters"]:
        chapter = await generate_chapter(ch_plan, story.style_directive, perspective)
        story.chapters.append(chapter)

    story.status = StoryStatus.READY
    return story

async def generate_chapter(ch_plan: dict, style_directive: str, perspective: str = None) -> Chapter:
    chapter_id = str(uuid.uuid4())
    title = ch_plan.get("title", "Untitled Chapter")
    core_concept = ch_plan.get("core_concept") or ch_plan.get("concept") or title
    narration_seed = ch_plan.get("narration_seed") or ch_plan.get("narration") or core_concept
    image_prompt_seed = ch_plan.get("image_prompt_seed") or ch_plan.get("image_prompt") or f"A cinematic scene showing {title}"
    chapter_index = ch_plan.get("index", 0)

    narration_prompt = build_narration_prompt(
        title, core_concept,
        narration_seed, style_directive, perspective
    )
    image_prompt = build_image_prompt(
        image_prompt_seed, style_directive, chapter_index
    )
    narration_script, image_url = await asyncio.gather(
        generate_text(narration_prompt, system=NARRATION_SYSTEM),
        generate_image(image_prompt)
    )
    pin_prompt = build_pin_prompt(image_prompt_seed, title)
    pins_raw = await generate_text(pin_prompt, system=PIN_ANALYZER_SYSTEM)
    pins_data = extract_json(pins_raw)
    print(f"[DEBUG] pins_data type: {type(pins_data).__name__}, value: {repr(str(pins_data)[:200])}")
    # Defensive guard: LLM sometimes wraps array in {"pins": [...]} object
    if isinstance(pins_data, dict):
        # Look for any list value in the dict
        for v in pins_data.values():
            if isinstance(v, list):
                pins_data = v
                break
        else:
            pins_data = []  # No list found, skip pins
    # Clamp pin coordinates to safe bounds
    pins = []
    for p in pins_data:
        if not isinstance(p, dict):
            print(f"[WARN] Skipping non-dict pin: {repr(p)}")
            continue
        p["x_pct"] = max(0.05, min(0.95, float(p.get("x_pct", 0.5))))
        p["y_pct"] = max(0.05, min(0.95, float(p.get("y_pct", 0.5))))
        # Fill missing concept_prompt from label + teaser
        if not p.get("concept_prompt"):
            p["concept_prompt"] = f"Deep dive into '{p.get('label', 'this concept')}': {p.get('teaser', '')}"
        pins.append(SpatialPin(**p))

    return Chapter(
        id=chapter_id,
        index=chapter_index,
        title=title,
        narration_script=narration_script.strip(),
        image_url=image_url,
        pins=pins,
        status=StoryStatus.READY
    )
