import json
from services.vertex_client import generate_text
from prompts.templates import PERSPECTIVE_SYSTEM, build_perspective_prompt
from agents.orchestrator import run_orchestrator
from models.schema import Story

async def run_perspective_flip(original_story: Story, new_perspective: str) -> Story:
    original_plan = {
        "topic_title": original_story.topic,
        "style_directive": original_story.style_directive,
        "chapters": [
            {
                "index": ch.index,
                "title": ch.title,
                "narration_seed": ch.narration_script,
                "core_concept": ch.title,
                "image_prompt_seed": f"Scene for chapter: {ch.title}"
            }
            for ch in original_story.chapters
        ]
    }
    return await run_orchestrator(
        topic=original_story.topic,
        perspective=new_perspective
    )
