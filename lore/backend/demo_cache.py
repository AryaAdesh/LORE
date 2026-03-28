import asyncio, json, os, base64
from dotenv import load_dotenv
load_dotenv()

from agents.orchestrator import run_orchestrator
from agents.enrichment_agent import run_enrichment

async def main():
    # Pre-generate the primary demo story
    enrich = await run_enrichment("the death of a star and black hole formation")
    print("Enriched:", enrich.enriched_topic)
    
    story = await run_orchestrator(enrich.enriched_brief)
    
    # Save story JSON (without full base64 images — those stay in memory)
    # Save images to disk separately
    os.makedirs("demo_cache", exist_ok=True)
    
    story_data = story.model_dump()
    for i, chapter in enumerate(story_data["chapters"]):
        if chapter["image_url"] and chapter["image_url"].startswith("data:"):
            b64 = chapter["image_url"].split(",")[1]
            img_path = f"demo_cache/chapter_{i}.png"
            with open(img_path, "wb") as f:
                f.write(base64.b64decode(b64))
            chapter["image_url"] = f"/demo_cache/{i}"
    
    with open("demo_cache/story.json", "w") as f:
        json.dump(story_data, f, indent=2)
    
    print(f"✅ Demo cache saved. Story: {story.topic}")
    print(f"   Chapters: {len(story.chapters)}")
    for ch in story.chapters:
        print(f"   - {ch.title} | pins: {[p.label for p in ch.pins]}")

asyncio.run(main())
