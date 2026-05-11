"""
Pydantic schemas for the music recommendation feature slice.

Single responsibility: request/response shape validation for music endpoints.
"""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MusicRecommendationRequest(BaseModel):
    emotion: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(extra="forbid")


class MusicRecommendationResponse(BaseModel):
    success: bool
    music_file: Optional[str] = None
    emotion: str
    total_tracks: int
    played_count: int
    message: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ReportPlayedRequest(BaseModel):
    music_file: str = Field(..., min_length=1, max_length=500)
    emotion: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class ReportFailedRequest(BaseModel):
    music_file: str = Field(..., min_length=1, max_length=500)

    model_config = ConfigDict(extra="forbid")


class ResetHistoryRequest(BaseModel):
    emotion: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(extra="forbid")
