"""
Pydantic schemas for the YouTube recommendation feature slice.

Single responsibility: request/response shape validation for YouTube endpoints.
"""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class YouTubeRecommendationRequest(BaseModel):
    emotion: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[str] = Field(None, max_length=100)
    excluded_video_ids: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class YouTubeRecommendationResponse(BaseModel):
    success: bool
    youtube_video_id: Optional[str] = None
    title: Optional[str] = None
    content_type: Optional[str] = None
    emotion: str
    total_videos: int
    played_count: int
    message: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ReportFailureRequest(BaseModel):
    youtube_video_id: str = Field(..., min_length=1, max_length=50)
    error_code: Optional[int] = None

    model_config = ConfigDict(extra="forbid")


class ReportSuccessRequest(BaseModel):
    youtube_video_id: str = Field(..., min_length=1, max_length=50)
    emotion: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class ResetHistoryRequest(BaseModel):
    emotion: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(extra="forbid")


class EmotionHealthEntry(BaseModel):
    total: int
    available: int
    health_percentage: float

    model_config = ConfigDict(extra="forbid")


class VideoHealthResponse(BaseModel):
    total_videos: int
    available_videos: int
    unavailable_videos: int
    overall_health_percentage: float
    emotion_breakdown: dict[str, EmotionHealthEntry]

    model_config = ConfigDict(extra="forbid")
