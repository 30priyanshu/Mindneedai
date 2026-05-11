"""
Analysis History schemas.

Single responsibility: Pydantic output contracts for history endpoints.
No business logic or DB access.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel

from server.utils.pagination import PaginatedResponse


class AnalysisHistoryItem(BaseModel):
    request_id: str
    prediction_label: str
    confidence: float
    requires_human_review: bool
    created_at: datetime
    # Optional metadata fields surfaced from analysis_metadata JSON
    modality: Optional[str] = None
    summary: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_record(cls, record: Any) -> "AnalysisHistoryItem":
        # backward compat for older object access
        metadata: dict = getattr(record, "analysis_metadata", {}) or {}
        return cls(
            request_id=getattr(record, "request_id", ""),
            prediction_label=getattr(record, "prediction_label", ""),
            confidence=getattr(record, "confidence", 0.0),
            requires_human_review=getattr(record, "requires_human_review", False),
            created_at=getattr(record, "created_at", datetime.utcnow()),
            modality=metadata.get("modality"),
            summary=metadata.get("summary"),
        )

    @classmethod
    def parse_row(cls, row) -> "AnalysisHistoryItem":
        import json
        metadata = row.analysis_metadata or {}
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except Exception:
                metadata = {}
        
        # Extract summary based on modality
        summary = metadata.get("summary")
        if not summary and row.modality == "speech":
            insights = metadata.get("clinical_insights", [])
            if insights and isinstance(insights, list) and len(insights) > 0:
                summary = insights[0].get("recommendation")
        if not summary and row.modality == "video":
            summary = metadata.get("summary") or metadata.get("clinical_insight")
            
        return cls(
            request_id=row.request_id,
            prediction_label=row.prediction_label or "neutral",
            confidence=float(row.confidence) if row.confidence is not None else 0.0,
            requires_human_review=bool(row.requires_human_review),
            created_at=row.created_at,
            modality=row.modality,
            summary=summary,
        )


# Alias for the paginated list response
HistoryResponse = PaginatedResponse[AnalysisHistoryItem]
