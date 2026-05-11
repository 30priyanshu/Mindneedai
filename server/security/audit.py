"""
Structured audit logging.

AuditLogger.log() is the single entry point for all security-relevant events.
It guarantees:
  - Every record has: event_type, user_id (anonymised), action, status,
    duration_ms, request_id, and utc_timestamp.
  - The following fields are NEVER logged: password, jwt_secret_key,
    smtp_password, openai_api_key, and any key whose name contains "token",
    "secret", or "pii".
  - Records are emitted as structured JSON via loguru.

Callers MUST use BackgroundTasks.add_task(audit_logger.log, ...) — never
await log() inline, as that would block the response thread.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from loguru import logger

_BLOCKED_KEYS = frozenset(
    {
        "password",
        "jwt_secret_key",
        "smtp_password",
        "openai_api_key",
    }
)
_BLOCKED_SUBSTRINGS = ("token", "secret", "pii")


class AuditEventType(str, Enum):
    ACCOUNT_CREATION = "account_creation"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PROFILE_UPDATE = "profile_update"
    DOCTOR_CONNECTION = "doctor_connection"
    PATIENT_DATA_ACCESS = "patient_data_access"
    TEXT_ANALYSIS = "text_analysis"
    AUDIO_ANALYSIS_START = "audio_analysis_start"
    AUDIO_ANALYSIS_COMPLETE = "audio_analysis_complete"
    VIDEO_ANALYSIS_START = "video_analysis_start"
    VIDEO_ANALYSIS_COMPLETE = "video_analysis_complete"
    MODEL_PREDICTION = "model_prediction"
    HUMAN_REVIEW = "human_review"
    USER_FEEDBACK = "user_feedback"
    DATA_ACCESS = "data_access"
    EMERGENCY_ALERT = "emergency_alert"
    AI_INSIGHTS_GENERATED = "ai_insights_generated"
    AI_INSIGHTS_ACCESSED = "ai_insights_accessed"
    AI_INSIGHTS_DELETED = "ai_insights_deleted"
    CONSENT_GRANTED = "consent_granted"
    CONSENT_REVOKED = "consent_revoked"
    PRIVACY_VIOLATION = "privacy_violation"


def _scrub(extra: Optional[dict]) -> dict:
    """Remove any key that matches the blocked list or contains a blocked substring."""
    if not extra:
        return {}
    return {
        k: v
        for k, v in extra.items()
        if k not in _BLOCKED_KEYS
        and not any(sub in k.lower() for sub in _BLOCKED_SUBSTRINGS)
    }


class AuditLogger:
    """Stateless; safe to instantiate once at startup and inject everywhere."""

    def log(
        self,
        event_type: AuditEventType,
        user_id: str,
        action: str,
        status: str,
        duration_ms: float,
        request_id: str,
        extra: Optional[dict] = None,
    ) -> None:
        """Emit one structured audit record.

        Parameters
        ----------
        event_type   : AuditEventType enum member
        user_id      : Anonymised user identifier (call privacy.anonymise_user_id first)
        action       : Short verb phrase describing what happened, e.g. "submit_phq9"
        status       : "success" | "failure" | "partial"
        duration_ms  : Wall-clock milliseconds for the operation
        request_id   : X-Request-ID from the HTTP request
        extra        : Optional domain-specific metadata; secrets are scrubbed automatically
        """
        record = {
            "event_type": event_type.value,
            "user_id": user_id,
            "action": action,
            "status": status,
            "duration_ms": round(duration_ms, 2),
            "request_id": request_id,
            "utc_timestamp": datetime.now(timezone.utc).isoformat(),
            **_scrub(extra),
        }
        logger.bind(**record).info("audit_event")
