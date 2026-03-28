import os
import sys
import json
import asyncio
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv()

from agents.enrichment_agent import run_enrichment
from agents.orchestrator import run_orchestrator
import agents.orchestrator

# Temporarily hardcode chapters list to first item only for testing
original_loads = json.loads
def patched_loads(raw, *args, **kwargs):
    res = original_loads(raw, *args, **kwargs)
    if isinstance(res, dict) and "chapters" in res and isinstance(res["chapters"], list):
        if len(res["chapters"]) > 0:
            res["chapters"] = [res["chapters"][0]]
    return res
json.loads = patched_loads

async def test():
    try:
        print("Testing Enrichment Agent...")
        sys.stdout.flush()
        enrich_res = await run_enrichment("mitosis and meiosis")
        print("After run_enrichment")
        sys.stdout.flush()
        print("Enriched Topic:", enrich_res.enriched_topic)
        print("Enriched Brief:", enrich_res.enriched_brief)

        print("-" * 40)
        print("Testing Orchestrator Agent (1 chapter)...")
        # passing enriched_brief as topic
        story = await run_orchestrator(enrich_res.enriched_brief)
        
        print("Story Topic:", story.topic)
        print("Story Style:", story.style_directive)
        
        for ch in story.chapters:
            print(f"\nChapter Title: {ch.title}")
            print(f"Narration Length: {len(ch.narration_script)}")
            img = ch.image_url
            print(f"Image URL: {img[:50] if img else 'None'}...")
            print(f"Pin Labels: {[p.label for p in ch.pins]}")
            import base64
            b64 = img.split(',')[1]
            with open("test_image.png", "wb") as f:
                f.write(base64.b64decode(b64))
            print("Image saved to backend/test_image.png")
        
        print("\nPHASE 3 COMPLETE")
    except BaseException as e:
        print("TEST FAILED (BaseException):", type(e), repr(e))
        raise

if __name__ == "__main__":
    asyncio.run(test())
