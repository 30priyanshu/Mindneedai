from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class AudioSessionRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Deprecated; sourced from Authorization token")
    audio_source: Optional[str] = Field("web", description="Audio source platform")


class AudioSessionResponse(BaseModel):
    session_id: str
    user_id: str
    status: str
    start_time: datetime
    duration_seconds: Optional[float] = 0.0
    dominant_emotion: Optional[str] = None
    average_confidence: Optional[float] = None
    requires_human_review: bool = False
    review_request_id: Optional[str] = None


class AudioAnalysisRequest(BaseModel):
    session_id: str = Field(..., description="Current recording session ID")
    chunk_index: Optional[int] = Field(0, description="Index of the audio chunk")


class AudioAnalysisResult(BaseModel):
    session_id: str
    chunk_index: int
    emotion: str
    confidence: float
    quality_score: float
    clinical_insight: Optional[str] = None


class AudioFileAnalysisResponse(BaseModel):
    session_id: str
    audio_file: str
    duration_seconds: float
    dominant_emotion: str
    confidence: float
    emotion_distribution: Dict[str, float]
    audio_quality_score: float
    requires_human_review: bool
    review_request_id: Optional[str] = None
    clinical_insights: Dict[str, Any] = {}
    agentic_analysis: Optional[Dict[str, Any]] = None
    timestamp: datetime


class AudioFeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Session to provide feedback for")
    reviewer_id: str = Field(..., description="ID of the reviewer")
    human_assessment: str = Field(..., description="Human-provided emotion assessment")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    review_notes: Optional[str] = None
    audio_quality_rating: Optional[float] = Field(None, ge=0.0, le=1.0)
