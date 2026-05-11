from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")
    consent_token: Optional[str] = Field(None, description="Consent token for advanced privacy processing")
    user_id: Optional[str] = Field(None, description="Deprecated; sourced from Authorization token")


class PredictionModel(BaseModel):
    label: str
    confidence: float


class ReasonerAnalysisModel(BaseModel):
    clinical_insight: str
    cognitive_distortions: List[str]
    grounding_techniques: List[str]


class AnalysisResponse(BaseModel):
    request_id: str
    user_id: str
    prediction: PredictionModel
    all_predictions: List[PredictionModel]
    requires_human_review: bool
    confidence_level: str
    review_request_id: Optional[str] = None
    timestamp: datetime
    agentic_analysis: Optional[ReasonerAnalysisModel] = None
    care_recommendations: List[str] = []
    personalized_response: str = ""


class FeedbackRequest(BaseModel):
    user_id: str = Field(..., description="The ID of the user")
    original_request_id: str = Field(..., description="The original analysis request ID")
    feedback: Dict[str, Any] = Field(..., description="User feedback data")
