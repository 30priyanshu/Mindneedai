"""
Pydantic schemas for the local video recommendation feature slice.

Single responsibility: request/response shape validation for local video endpoints.
"""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VideoRecommendationRequest(BaseModel):
    emotion: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(extra="forbid")


class VideoRecommendationResponse(BaseModel):
    success: bool
    video_file: Optional[str] = None
    emotion: str
    total_videos: int
    played_count: int
    message: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ReportPlayedRequest(BaseModel):
    video_file: str = Field(..., min_length=1, max_length=500)
    emotion: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class ReportFailedRequest(BaseModel):
    video_file: str = Field(..., min_length=1, max_length=500)

    model_config = ConfigDict(extra="forbid")


class ResetHistoryRequest(BaseModel):
    emotion: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(extra="forbid")
