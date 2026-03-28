from utils.json_utils import extract_json
from services.vertex_client import generate_text
from prompts.templates import ENRICHMENT_SYSTEM, build_enrichment_prompt
from models.schema import EnrichPromptResponse

async def run_enrichment(raw_input: str) -> EnrichPromptResponse:
    prompt = build_enrichment_prompt(raw_input)
    raw = await generate_text(prompt, system=ENRICHMENT_SYSTEM)
    data = extract_json(raw)
    return EnrichPromptResponse(
        enriched_topic=data["enriched_topic"],
        enriched_brief=data["enriched_brief"],
        suggested_perspective=data.get("suggested_perspective")
    )
