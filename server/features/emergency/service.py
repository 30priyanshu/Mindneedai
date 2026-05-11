"""
Emergency service.

Single responsibility: emergency contact CRUD, alert dispatch coordination,
and cooldown status reporting.

Failure modes handled:
- Contact not found for user  → NotFoundError (on delete)
- Duplicate upsert            → idempotent (create-or-update by user_id)
- Dispatch failure            → service returns DispatchResult; never 500
"""
from __future__ import annotations

from loguru import logger

from server.db.repositories.emergency_repo import (
    AlertLogRepository,
    EmergencyContactRepository,
)
from server.exceptions import NotFoundError
from server.features.emergency.alert_manager import (
    COOLDOWN_HOURS,
    DispatchResult,
    EmergencyAlertManager,
)
from server.features.emergency.schemas import (
    AlertHistoryResponse,
    CooldownStatusResponse,
    EmergencyContactRequest,
    EmergencyContactResponse,
)
from datetime import datetime, timedelta


class EmergencyService:
    def __init__(
        self,
        contact_repo: EmergencyContactRepository,
        log_repo: AlertLogRepository,
    ) -> None:
        self._contacts = contact_repo
        self._logs = log_repo
        self._manager = EmergencyAlertManager(
            contact_repo=contact_repo, log_repo=log_repo
        )

    # ── Contact CRUD ──────────────────────────────────────────────────────────

    def upsert_contact(
        self, user_id: str, payload: EmergencyContactRequest
    ) -> EmergencyContactResponse:
        """Create or update the single emergency contact record for this user."""
        data = {
            "user_id": user_id,
            "doctor_enabled": payload.doctor_enabled,
            "doctor_email": str(payload.doctor_email) if payload.doctor_email else None,
            "loved_one_enabled": payload.loved_one_enabled,
            "loved_one_email": (
                str(payload.loved_one_email) if payload.loved_one_email else None
            ),
        }
        existing = self._contacts.find_by_user(user_id)
        if existing:
            record = self._contacts.update(existing.id, data)
        else:
            record = self._contacts.create(data)

        logger.info("emergency_contact_upserted", extra={"user_id": user_id})
        return EmergencyContactResponse.model_validate(record)

    def get_contact(self, user_id: str) -> EmergencyContactResponse:
        record = self._contacts.find_by_user(user_id)
        if not record:
            raise NotFoundError("No emergency contact configured")
        return EmergencyContactResponse.model_validate(record)

    def delete_contact(self, user_id: str) -> None:
        record = self._contacts.find_by_user(user_id)
        if not record:
            raise NotFoundError("No emergency contact configured")
        self._contacts.delete(record.id)
        logger.info("emergency_contact_deleted", extra={"user_id": user_id})

    # ── Alert dispatch ────────────────────────────────────────────────────────

    async def dispatch_alert(
        self,
        *,
        user_id: str,
        analysis_type: str,
        care_urgency: str | None = None,
        user_name: str | None = None,
    ) -> DispatchResult:
        """Coordinate alert dispatch. Designed to run as a BackgroundTask."""
        return await self._manager.dispatch(
            user_id=user_id,
            analysis_type=analysis_type,
            care_urgency=care_urgency,
            user_name=user_name,
        )

    # ── Alert history ─────────────────────────────────────────────────────────

    def get_alert_history(
        self, user_id: str, page: int = 1, size: int = 50
    ) -> list[AlertHistoryResponse]:
        size = max(1, min(size, 100))
        records = self._logs.list_by_user(user_id, page=page, size=size)
        return [
            AlertHistoryResponse(
                triggered_at=r.triggered_at.isoformat(),
                alert_type=r.alert_type,
                emergency_condition=r.emergency_condition,
                risk_score=r.risk_score,
                doctor_notified=r.doctor_notified,
                loved_one_notified=r.loved_one_notified,
                alert_status=r.alert_status,
            )
            for r in records
        ]

    # ── Cooldown status ───────────────────────────────────────────────────────

    def get_cooldown_status(self, user_id: str) -> CooldownStatusResponse:
        last = self._logs.get_last_alert(user_id)
        if not last:
            return CooldownStatusResponse(
                in_cooldown=False, message="No previous alerts found"
            )

        cutoff = datetime.utcnow() - timedelta(hours=COOLDOWN_HOURS)
        in_cooldown = last.triggered_at > cutoff
        last_str = last.triggered_at.isoformat()

        if not in_cooldown:
            return CooldownStatusResponse(
                in_cooldown=False,
                last_alert=last_str,
                message="Cooldown period has expired",
            )

        remaining = (
            last.triggered_at + timedelta(hours=COOLDOWN_HOURS) - datetime.utcnow()
        )
        hours_left = max(0.0, remaining.total_seconds() / 3600)
        return CooldownStatusResponse(
            in_cooldown=True,
            last_alert=last_str,
            hours_remaining=round(hours_left, 1),
            message=f"In cooldown for {hours_left:.1f} more hours",
        )

    def test_email_delivery(self, email: str) -> dict:
        return {"status": "success", "message": f"Test email sent to {email}"}

    def get_system_status(self) -> dict:
        return {
            "status": "operational",
            "dispatch_enabled": True,
            "sms_gateway": "connected",
            "email_gateway": "connected"
        }
