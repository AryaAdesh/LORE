import asyncio
from services.vertex_client import generate_text
from prompts.templates import ORCHESTRATOR_SYSTEM, build_pdf_story_prompt
from agents.orchestrator import run_orchestrator
from models.schema import Story
import json

async def run_pdf_pipeline(pdf_text: str) -> Story:
    prompt = build_pdf_story_prompt(pdf_text)
    raw = await generate_text(prompt, system=ORCHESTRATOR_SYSTEM)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    plan = json.loads(raw)
    return await run_orchestrator(topic=plan.get("topic_title", "Document Story"))
