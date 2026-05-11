from __future__ import annotations

import math
import uuid

from loguru import logger
from sqlalchemy import delete

from server.db.models.notification import Notification
from server.db.repositories.notification_repo import NotificationRepository
from server.exceptions import NotFoundError
from server.features.notifications.schemas import NotificationListResponse, NotificationResponse


class NotificationService:
    def __init__(self, repo: NotificationRepository) -> None:
        self._repo = repo

    def list_notifications(
        self,
        *,
        user_id: str | None = None,
        doctor_id: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> NotificationListResponse:
        size = max(1, min(size, 100))
        skip = (page - 1) * size

        items, total = self._repo.paginate(
            user_id=user_id, doctor_id=doctor_id, skip=skip, limit=size
        )
        unread = self._repo.count_unread(user_id=user_id, doctor_id=doctor_id)
        total_pages = math.ceil(total / size) if size else 0
        return NotificationListResponse(
            items=[self._to_response(n) for n in items],
            total=total,
            page=page,
            page_size=size,
            total_pages=total_pages,
            unread_count=unread,
        )

    def mark_read(self, notification_id: str, *, caller_id: str) -> NotificationResponse:
        notif = self._repo.find_by_notification_id(notification_id)
        if not notif or not self._owns(notif, caller_id):
            raise NotFoundError("Notification not found")
        updated = self._repo.update(notif.id, {"read": True})
        return self._to_response(updated)  # type: ignore[arg-type]

    def mark_all_read(self, *, user_id: str | None, doctor_id: str | None) -> int:
        return self._repo.mark_all_read(user_id=user_id, doctor_id=doctor_id)

    def delete_notification(self, notification_id: str, *, caller_id: str) -> None:
        notif = self._repo.find_by_notification_id(notification_id)
        if not notif or not self._owns(notif, caller_id):
            raise NotFoundError("Notification not found")
        self._repo.delete(notif.id)

    def unread_count(
        self,
        *,
        user_id: str | None = None,
        doctor_id: str | None = None,
    ) -> int:
        return self._repo.count_unread(user_id=user_id, doctor_id=doctor_id)

    def clear_all(self, *, user_id: str | None, doctor_id: str | None) -> None:
        self._repo.clear_all(user_id=user_id, doctor_id=doctor_id)

    # Cross-domain event helpers — fire-and-forget, never raise

    def notify_user_connected_to_doctor(self, *, user_id: str, doctor_name: str) -> None:
        self._create(
            user_id=user_id,
            type_="success",
            title="Connected to Doctor",
            message=f"You have successfully connected to Dr. {doctor_name}",
            action_url="/connect-doctor",
        )

    def notify_doctor_user_connected(self, *, doctor_id: str, user_name: str) -> None:
        self._create(
            doctor_id=doctor_id,
            type_="info",
            title="New Patient Connected",
            message=f"{user_name} has connected to you as a patient",
            action_url="/doctor/patients",
        )

    def notify_user_disconnected(self, *, user_id: str, doctor_name: str) -> None:
        self._create(
            user_id=user_id,
            type_="info",
            title="Disconnected from Doctor",
            message=f"You have disconnected from Dr. {doctor_name}",
            action_url="/connect-doctor",
        )

    def notify_doctor_user_disconnected(self, *, doctor_id: str, user_name: str) -> None:
        self._create(
            doctor_id=doctor_id,
            type_="warning",
            title="Patient Disconnected",
            message=f"{user_name} has disconnected from you",
            action_url="/doctor/patients",
        )

    def notify_wellness_form_created(
        self, *, user_id: str, doctor_name: str, form_id: str, client_name: str
    ) -> None:
        self._create(
            user_id=user_id,
            type_="info",
            title="New Wellness Form",
            message=f"Dr. {doctor_name} has created a new mental wellness form for {client_name}",
            action_url=f"/wellness-forms/{form_id}",
        )

    def notify_wellness_form_updated(
        self, *, user_id: str, doctor_name: str, form_id: str, client_name: str
    ) -> None:
        self._create(
            user_id=user_id,
            type_="info",
            title="Wellness Form Updated",
            message=f"Dr. {doctor_name} has updated the wellness form for {client_name}",
            action_url=f"/wellness-forms/{form_id}",
        )

    def notify_analysis_complete(self, *, user_id: str, analysis_type: str) -> None:
        _labels = {
            "text": "Text Analysis",
            "video": "Video Analysis",
            "audio": "Audio Analysis",
        }
        label = _labels.get(analysis_type.lower(), "Analysis")
        self._create(
            user_id=user_id,
            type_="analysis",
            title=f"{label} Complete",
            message=f"Your {label.lower()} has been completed. View results in history.",
            action_url="/history",
        )

    def notify_ai_report_sent(
        self, *, user_id: str, doctor_name: str, form_id: str, client_name: str
    ) -> None:
        self._create(
            user_id=user_id,
            type_="info",
            title="Wellness Report Available",
            message=f"Dr. {doctor_name} has reviewed and shared the AI insights for {client_name}",
            action_url=f"/wellness-forms/{form_id}",
        )

    def notify_emergency(self, *, user_id: str) -> None:
        self._create(
            user_id=user_id,
            type_="emergency",
            title="Emergency Alert",
            message="URGENT: Clinical risk detected in your analysis — immediate review required.",
            action_url="/history",
        )

    # Private helpers

    def _create(
        self,
        *,
        type_: str,
        title: str,
        message: str,
        user_id: str | None = None,
        doctor_id: str | None = None,
        action_url: str | None = None,
    ) -> None:
        try:
            self._repo.create(
                {
                    "notification_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "doctor_id": doctor_id,
                    "type": type_,
                    "title": title,
                    "message": message,
                    "action_url": action_url,
                    "read": False,
                }
            )
        except Exception:
            logger.exception("notification_create_failed", extra={"title": title})

    @staticmethod
    def _owns(notif: Notification, caller_id: str) -> bool:
        return notif.user_id == caller_id or notif.doctor_id == caller_id

    @staticmethod
    def _to_response(n: Notification) -> NotificationResponse:
        return NotificationResponse(
            notification_id=n.notification_id,
            type=n.type,
            title=n.title,
            message=n.message,
            read=n.read,
            action_url=n.action_url,
            created_at=n.created_at.isoformat() if n.created_at else None,
        )
