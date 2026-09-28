"""Common shared enums and response schemas."""
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

class ProvenanceEnum(str, Enum):
    """Explicit data origin tag to guarantee experimental vs synthetic separation."""
    ALLEN_EXPERIMENTAL = "allen_experimental"
    SYNTHETIC_LIF = "synthetic_lif"
    USER_UPLOADED = "user_uploaded"

class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="ok", description="Service health status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Server UTC timestamp")
    active_dataset: str = Field(
        default="Allen Brain Observatory - Neuropixels Visual Coding",
        description="Official active electrophysiology dataset"
    )
    cache_ready: bool = Field(default=False, description="Whether the local metadata cache is initialized")
