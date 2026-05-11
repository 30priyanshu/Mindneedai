"""
Health Metrics service.

Single responsibility: vitals persistence + OpenAI interpretation orchestration.
OpenAI client injected — never imported directly.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional

from loguru import logger
from sqlalchemy.orm import Session

from server.db.models.health_metrics import HealthMetricsEntry
from server.db.repositories.health_metrics_repo import HealthMetricsRepository
from server.exceptions import NotFoundError
from server.features.health_metrics.schemas import (
    HealthMetricsEntryRequest,
    HealthMetricsEntryResponse,
)
from server.features.health_metrics.validator import HealthMetricsValidation, HealthMetricsValidator


def _to_response(
    entry: HealthMetricsEntry, warnings: list[str] | None = None
) -> HealthMetricsEntryResponse:
    return HealthMetricsEntryResponse(
        entry_id=entry.entry_id,
        user_id=entry.user_id,
        timestamp=entry.timestamp,
        date=entry.date,
        metrics={
            "oxygen_level": entry.oxygen_level,
            "systolic_bp": entry.systolic_bp,
            "diastolic_bp": entry.diastolic_bp,
            "pulse_rate": entry.pulse_rate,
        },
        ai_analysis=entry.ai_analysis,
        risk_level=entry.risk_level,
        warnings=warnings or [],
        note=entry.note,
    )


async def _interpret_metrics(
    openai_client: Any,
    entry: HealthMetricsEntryRequest,
    prior: list[dict[str, Any]],
    model: str,
) -> Optional[dict[str, Any]]:
    """Call OpenAI for health metric insights. Returns None on any failure."""
    messages = [
        {
            "role": "system",
            "content": (
                "You are a cautious health assistant. Return concise JSON with fields: "
                "{analysis: string, recommendations: string[], risk_level: one of [normal,caution,danger], "
                "key_concerns: string[]}. Keep guidance non-diagnostic and safety-first."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Current metrics: oxygen_level={entry.oxygen_level}, "
                f"systolic_bp={entry.systolic_bp}, diastolic_bp={entry.diastolic_bp}, "
                f"pulse_rate={entry.pulse_rate}, note={entry.note or 'None'}, "
                f"recent_entries={prior}"
            ),
        },
    ]
    import json

    try:
        response = await openai_client.generate_completion(
            messages, model=model, response_format={"type": "json_object"}, temperature=0.2, max_tokens=800
        )
        raw = response.choices[0].message.content
        result = json.loads(raw) if raw else None
        if not result:
            return None
        return {
            "analysis": result.get("analysis"),
            "recommendations": result.get("recommendations", []),
            "risk_level": result.get("risk_level"),
            "key_concerns": result.get("key_concerns", []),
        }
    except Exception as exc:
        logger.error("health_metrics_ai_failed", extra={"error": str(exc)})
        return None


def _merge_risk(validator_risk: str, ai_risk: Optional[str]) -> str:
    order = {"normal": 0, "caution": 1, "danger": 2}
    ai_level = order.get(ai_risk or "normal", 0)
    return max((validator_risk, ai_risk or "normal"), key=lambda r: order.get(r, 0))


class HealthMetricsService:
    def __init__(self, repo: HealthMetricsRepository, openai_client: Any, model: str) -> None:
        self._repo = repo
        self._openai = openai_client
        self._model = model

    async def create_entry(
        self, user_id: str, payload: HealthMetricsEntryRequest
    ) -> HealthMetricsEntryResponse:
        validation: HealthMetricsValidation = HealthMetricsValidator.validate_entry(
            o2=payload.oxygen_level,
            systolic=payload.systolic_bp,
            diastolic=payload.diastolic_bp,
            pulse=payload.pulse_rate,
        )
        if not validation.is_valid:
            from server.exceptions import ValidationError
            raise ValidationError("; ".join(validation.errors))

        prior_entries = self._repo.list_recent(user_id, limit=5)
        prior_serialized = [
            {
                "oxygen_level": e.oxygen_level,
                "systolic_bp": e.systolic_bp,
                "diastolic_bp": e.diastolic_bp,
                "pulse_rate": e.pulse_rate,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in prior_entries
        ]

        ai_result = await _interpret_metrics(self._openai, payload, prior_serialized, self._model)
        combined_risk = _merge_risk(validation.risk_level, ai_result.get("risk_level") if ai_result else None)

        now = datetime.utcnow()
        entry = self._repo.create({
            "entry_id": f"health_{uuid.uuid4().hex[:16]}",
            "user_id": user_id,
            "timestamp": now,
            "date": now.date(),
            "oxygen_level": payload.oxygen_level,
            "systolic_bp": payload.systolic_bp,
            "diastolic_bp": payload.diastolic_bp,
            "pulse_rate": payload.pulse_rate,
            "ai_analysis": ai_result,
            "risk_level": combined_risk,
            "note": payload.note,
        })
        logger.info("health_entry_created", extra={"user_id": user_id, "entry_id": entry.entry_id})
        return _to_response(entry, validation.warnings)

    def list_entries(
        self,
        user_id: str,
        start: date | None,
        end: date | None,
        page: int,
        size: int,
    ) -> list[HealthMetricsEntryResponse]:
        entries = self._repo.list_by_user(user_id, start, end, page, size)
        return [_to_response(e) for e in entries]

    def get_latest(self, user_id: str) -> Optional[HealthMetricsEntryResponse]:
        entry = self._repo.get_latest(user_id)
        return _to_response(entry) if entry else None

    def delete_entry(self, user_id: str, entry_id: str) -> None:
        entry = self._repo.find_by_entry_id(entry_id)
        if not entry or entry.user_id != user_id:
            raise NotFoundError("Health metrics entry not found")
        self._repo.delete(entry.id)
        logger.info("health_entry_deleted", extra={"user_id": user_id, "entry_id": entry_id})
