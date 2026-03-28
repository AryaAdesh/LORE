import asyncio, uuid
from utils.json_utils import extract_json
from services.vertex_client import generate_text
from prompts.templates import DRILLDOWN_SYSTEM, build_drilldown_prompt
from models.schema import Story, StoryStatus
from agents.orchestrator import generate_chapter

async def run_drilldown(concept_prompt: str, parent_style: str) -> Story:
    prompt = build_drilldown_prompt(concept_prompt, parent_style)
    raw = await generate_text(prompt, system=DRILLDOWN_SYSTEM)
    plan = extract_json(raw)
    sub_story = Story(
        id=str(uuid.uuid4()),
        topic=plan.get("topic_title", "Drill-down"),
        style_directive=plan.get("style_directive", parent_style),
        status=StoryStatus.GENERATING
    )
    for ch_plan in plan["chapters"]:
        chapter = await generate_chapter(ch_plan, sub_story.style_directive)
        sub_story.chapters.append(chapter)
    sub_story.status = StoryStatus.READY
    return sub_story
