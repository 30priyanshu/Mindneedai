from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class StartSessionRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Deprecated; sourced from Authorization token")


class SessionResponse(BaseModel):
    session_id: str
    status: str
    start_time: datetime


class FrameAnalysisRequest(BaseModel):
    session_id: str = Field(..., description="The video session ID")
    frame_data: str = Field(..., description="Base64-encoded JPEG frame from canvas.toDataURL()")
    frame_number: int = Field(..., description="Index of the frame")
    timestamp: float = Field(..., description="Video timestamp in seconds")


class FrameAnalysisResponse(BaseModel):
    frame_number: int
    face_detected: bool
    emotion: str
    confidence: float
    box_coords: Optional[List[int]] = None
    requires_review: bool = False


class EndSessionRequest(BaseModel):
    session_id: str = Field(..., description="The session to close")


class SessionSummaryResponse(BaseModel):
    session_id: str
    status: str = "completed"
    total_frames: int
    valid_frames: int
    duration_seconds: float
    dominant_emotion: str
    average_confidence: float
    emotion_distribution: Dict[str, float] = {}
    requires_human_review: bool = False
    review_request_id: Optional[str] = None
    agentic_analysis: Optional[Dict[str, Any]] = None
