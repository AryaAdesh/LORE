from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uuid

class StoryStatus(str, Enum):
    PENDING = "pending"
    GENERATING = "generating"
    READY = "ready"
    ERROR = "error"

class SpatialPin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    teaser: str
    x_pct: float
    y_pct: float
    concept_prompt: Optional[str] = None

class Chapter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    index: int
    title: str
    narration_script: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    pins: List[SpatialPin] = []
    duration_seconds: int = 30
    status: StoryStatus = StoryStatus.PENDING

class Story(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    style_directive: str
    chapters: List[Chapter] = []
    status: StoryStatus = StoryStatus.PENDING
    source_type: str = "topic"
    perspective: Optional[str] = None
    enriched_brief: Optional[str] = None
    slides_url: Optional[str] = None
    docs_url: Optional[str] = None

class CreateStoryRequest(BaseModel):
    topic: str
    perspective: Optional[str] = None

class EnrichPromptRequest(BaseModel):
    raw_input: str

class EnrichPromptResponse(BaseModel):
    enriched_topic: str
    enriched_brief: str
    suggested_perspective: Optional[str] = None
    confirmed: bool = False

class DrillDownRequest(BaseModel):
    story_id: str
    chapter_id: str
    pin_id: str

class PerspectiveRequest(BaseModel):
    story_id: str
    perspective: str

class ExportRequest(BaseModel):
    story_id: str
    export_type: str

class StoryBranch(BaseModel):
    label: str
    teaser: str
    prompt_seed: str

class BranchRequest(BaseModel):
    story_id: str
    chapter_id: str
    branch_prompt: str   # The prompt_seed from the chosen branch
