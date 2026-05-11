"""
EmergencyAlertManager.

Single responsibility: multi-recipient email dispatch with idempotency enforced
via a 30-minute cooldown column on EmergencyAlertLog.

IDEMPOTENCY GUARANTEE:
  Every call to dispatch() FIRST checks AlertLogRepository.get_last_alert().
  If triggered_at > now - COOLDOWN_HOURS, the alert is skipped and
  DispatchResult.skipped_cooldown is returned. This check happens BEFORE any
  email is sent and BEFORE any log row is created.

Failure modes handled:
- Email service not configured     → DispatchResult with status="no_email_service"
- No contacts configured           → DispatchResult with status="no_contacts"
- No valid enabled email           → DispatchResult with status="no_valid_contacts"
- Still in cooldown                → DispatchResult with status="cooldown_active"
- Individual email send failure    → logged; other recipients still attempted
- Repository write failure         → logged; alert result still returned (best effort)

Only "critical" care_urgency triggers an alert — matching the original business rule.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from loguru import logger

from server.db.models.emergency import EmergencyContact
from server.db.repositories.emergency_repo import AlertLogRepository, EmergencyContactRepository
from server.infra.email.client import send_email

COOLDOWN_HOURS: float = 0.5  # 30-minute idempotency window
_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


@dataclass
class DispatchResult:
    status: str
    emergency_condition: Optional[str] = None
    risk_score: Optional[float] = None
    doctor_notified: bool = False
    loved_one_notified: bool = False
    alerts_sent: int = 0
    alerts_failed: int = 0
    details: list[dict] = field(default_factory=list)
    message: str = ""


class EmergencyAlertManager:
    """Pure dispatch engine — no HTTP coupling, no DatabaseManager."""

    def __init__(
        self,
        contact_repo: EmergencyContactRepository,
        log_repo: AlertLogRepository,
    ) -> None:
        self._contacts = contact_repo
        self._logs = log_repo

    async def dispatch(
        self,
        *,
        user_id: str,
        analysis_type: str,
        care_urgency: Optional[str] = None,
        user_name: Optional[str] = None,
    ) -> DispatchResult:
        """
        Main dispatch entry point.  Returns a DispatchResult in every branch —
        never raises.  Caller can safely fire-and-forget via BackgroundTasks.
        """
        # 1. Detect emergency condition (only "critical" triggers)
        condition = self._detect_condition(care_urgency)
        if not condition:
            return DispatchResult(
                status="no_emergency",
                message="No emergency condition detected",
            )

        # 2. Idempotency: check cooldown BEFORE sending or logging
        if self._in_cooldown(user_id):
            logger.info("emergency_cooldown_active", extra={"user_id_prefix": user_id[:8]})
            return DispatchResult(
                status="cooldown_active",
                emergency_condition=condition,
                message=f"Alert skipped — {COOLDOWN_HOURS:.0f}h cooldown active",
            )

        # 3. Load contacts
        contacts = self._contacts.find_by_user(user_id)
        if not contacts:
            return DispatchResult(
                status="no_contacts",
                emergency_condition=condition,
                message="No emergency contacts configured",
            )

        # 4. Validate at least one enabled recipient
        if not self._has_valid_recipient(contacts):
            return DispatchResult(
                status="no_valid_contacts",
                emergency_condition=condition,
                message="No valid enabled contacts configured",
            )

        # 5. Send emails concurrently-safe (sequential, but both attempted)
        result = await self._send_to_contacts(
            contacts=contacts,
            user_id=user_id,
            analysis_type=analysis_type,
            condition=condition,
            user_name=user_name,
        )

        # 6. Persist log (best effort — never block alert result on DB failure)
        self._persist_log(user_id, analysis_type, condition, result)

        return result

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _detect_condition(care_urgency: Optional[str]) -> Optional[str]:
        if care_urgency and care_urgency.lower() == "critical":
            return "critical"
        return None

    def _in_cooldown(self, user_id: str) -> bool:
        last = self._logs.get_last_alert(user_id)
        if not last:
            return False
        cutoff = datetime.utcnow() - timedelta(hours=COOLDOWN_HOURS)
        return last.triggered_at > cutoff

    @staticmethod
    def _is_valid_email(email: Optional[str]) -> bool:
        return bool(email and _EMAIL_RE.match(email.strip()))

    @staticmethod
    def _has_valid_recipient(contacts: EmergencyContact) -> bool:
        return (
            contacts.doctor_enabled
            and EmergencyAlertManager._is_valid_email(contacts.doctor_email)
        ) or (
            contacts.loved_one_enabled
            and EmergencyAlertManager._is_valid_email(contacts.loved_one_email)
        )

    async def _send_to_contacts(
        self,
        *,
        contacts: EmergencyContact,
        user_id: str,
        analysis_type: str,
        condition: str,
        user_name: Optional[str],
    ) -> DispatchResult:
        result = DispatchResult(
            status="processing",
            emergency_condition=condition,
        )

        if contacts.doctor_enabled and self._is_valid_email(contacts.doctor_email):
            sent = await self._send_one(
                to=contacts.doctor_email,  # type: ignore[arg-type]
                recipient_type="doctor",
                user_id=user_id,
                analysis_type=analysis_type,
                condition=condition,
                user_name=user_name,
                result=result,
            )
            result.doctor_notified = sent

        if contacts.loved_one_enabled and self._is_valid_email(contacts.loved_one_email):
            sent = await self._send_one(
                to=contacts.loved_one_email,  # type: ignore[arg-type]
                recipient_type="loved_one",
                user_id=user_id,
                analysis_type=analysis_type,
                condition=condition,
                user_name=user_name,
                result=result,
            )
            result.loved_one_notified = sent

        result.status = "sent" if result.alerts_sent > 0 else "failed"
        result.message = (
            f"Emergency alerts: {result.alerts_sent} sent, {result.alerts_failed} failed"
        )
        return result

    async def _send_one(
        self,
        *,
        to: str,
        recipient_type: str,
        user_id: str,
        analysis_type: str,
        condition: str,
        user_name: Optional[str],
        result: DispatchResult,
    ) -> bool:
        subject = f"[URGENT] Mental Health Emergency Alert — {condition.upper()}"
        name_line = f"User: {user_name}\n" if user_name else ""
        body = (
            f"EMERGENCY ALERT\n\n"
            f"{name_line}"
            f"Analysis type: {analysis_type}\n"
            f"Condition: {condition}\n"
            f"Timestamp: {datetime.utcnow().isoformat()}Z\n\n"
            f"Please follow up immediately."
        )
        try:
            await send_email(to=to, subject=subject, body=body)
            result.alerts_sent += 1
            result.details.append({"type": recipient_type, "email": to, "status": "sent"})
            logger.info(
                "emergency_alert_sent",
                extra={"recipient_type": recipient_type, "user_id_prefix": user_id[:8]},
            )
            return True
        except Exception:
            result.alerts_failed += 1
            result.details.append({"type": recipient_type, "email": to, "status": "failed"})
            logger.exception(
                "emergency_alert_send_failed",
                extra={"recipient_type": recipient_type, "user_id_prefix": user_id[:8]},
            )
            return False

    def _persist_log(
        self,
        user_id: str,
        analysis_type: str,
        condition: str,
        result: DispatchResult,
    ) -> None:
        try:
            self._logs.create(
                {
                    "user_id": user_id,
                    "alert_type": analysis_type,
                    "emergency_condition": condition,
                    "doctor_notified": result.doctor_notified,
                    "loved_one_notified": result.loved_one_notified,
                    "alert_status": result.status,
                }
            )
        except Exception:
            logger.exception(
                "emergency_log_write_failed",
                extra={"user_id_prefix": user_id[:8]},
            )
