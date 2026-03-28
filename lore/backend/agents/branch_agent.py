import json
from services.vertex_client import generate_text

BRANCH_SYSTEM = """
You are LORE's story branching engine. Given the current chapter of an educational story
and the overall topic, you generate 3 compelling directions the story could branch into next.

Each branch must:
- Be a genuinely different angle, not just a continuation
- Be specific enough to generate a visually distinct scene
- Feel like a natural "what if we zoomed in here instead?" moment
- Be 8-12 words — punchy and curiosity-provoking

Output a JSON array of exactly 3 branch objects:
[
  {
    "label": "string — 8-12 word branch title",
    "teaser": "string — one sentence of what this branch explores",
    "prompt_seed": "string — detailed prompt for the orchestrator to generate this next chapter"
  }
]

Respond ONLY with valid JSON. No markdown fences.
"""

async def generate_branches(story_topic: str, current_chapter_title: str,
                            current_narration: str, style_directive: str) -> list:
    prompt = f"""
Story topic: {story_topic}
Current chapter: {current_chapter_title}
Current narration: {current_narration}
Visual style: {style_directive}

Generate 3 branches for what to explore next.
"""
    raw = await generate_text(prompt, system=BRANCH_SYSTEM)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)
