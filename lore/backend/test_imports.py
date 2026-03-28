import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

# load .env as requested by the user just in case
load_dotenv()

from models.schema import Story, Chapter, SpatialPin, StoryStatus
import prompts.templates as P

def main():
    print("Schema models loaded successfully.")
    
    print("--- ENRICHMENT ---")
    print(P.ENRICHMENT_SYSTEM)
    print(P.build_enrichment_prompt("test"))
    
    print("--- ORCHESTRATOR ---")
    print(P.ORCHESTRATOR_SYSTEM)
    print(P.build_story_plan_prompt("test"))
    print(P.build_pdf_story_prompt("test pdf content"))
    
    print("--- NARRATION ---")
    print(P.NARRATION_SYSTEM)
    print(P.build_narration_prompt("chap 1", "concept 1", "seed", "style"))
    print(P.build_image_prompt("image seed", "style", 0))
    
    print("--- PIN ANALYZER ---")
    print(P.PIN_ANALYZER_SYSTEM)
    print(P.build_pin_prompt("scene desc", "chap title"))
    
    print("--- DRILLDOWN ---")
    print(P.DRILLDOWN_SYSTEM)
    print(P.build_drilldown_prompt("drill request", "style"))
    
    print("--- PERSPECTIVE ---")
    print(P.PERSPECTIVE_SYSTEM)
    print(P.build_perspective_prompt({"test": "data"}, "alien"))
    
    print("--- LIVE ---")
    print(P.LIVE_SYSTEM)
    print(P.build_live_context({"title": "chap1", "narration_script": "speech"}, "topic"))

if __name__ == "__main__":
    main()
