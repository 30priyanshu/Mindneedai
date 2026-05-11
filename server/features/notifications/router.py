from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.notification_repo import NotificationRepository
from server.features.auth.dependencies import get_current_user_or_doctor
from server.features.notifications.schemas import NotificationListResponse, NotificationResponse
from server.features.notifications.service import NotificationService

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


def _get_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(repo=NotificationRepository(db))


def _caller_id(principal: dict) -> str:
    return principal.get("user_id") or principal.get("doctor_id", "")


def _owner_ids(principal: dict) -> tuple[str | None, str | None]:
    return principal.get("user_id"), principal.get("doctor_id")


# NOTE: static-path routes (/unread-count, /read-all, /clear-all) MUST be declared
# before parameterised routes (/{notification_id}) so FastAPI does not greedily
# match the literal string as an {id} path parameter.


@notifications_router.get("/unread-count", response_model=dict[str, int])
def check_unread_count(
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> dict[str, int]:
    user_id, doctor_id = _owner_ids(principal)
    return {"unread_count": service.unread_count(user_id=user_id, doctor_id=doctor_id)}


@notifications_router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> dict[str, int]:
    user_id, doctor_id = _owner_ids(principal)
    count = service.mark_all_read(user_id=user_id, doctor_id=doctor_id)
    return {"marked_read": count}


@notifications_router.post("/clear-all", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_notifications(
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> None:
    user_id, doctor_id = _owner_ids(principal)
    service.clear_all(user_id=user_id, doctor_id=doctor_id)


@notifications_router.get("", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> NotificationListResponse:
    user_id, doctor_id = _owner_ids(principal)
    return service.list_notifications(
        user_id=user_id, doctor_id=doctor_id, page=page, size=size
    )


@notifications_router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
)
def mark_notification_read(
    notification_id: str,
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> NotificationResponse:
    return service.mark_read(notification_id, caller_id=_caller_id(principal))


@notifications_router.delete(
    "/{notification_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_notification(
    notification_id: str,
    principal: dict = Depends(get_current_user_or_doctor),
    service: NotificationService = Depends(_get_service),
) -> None:
    service.delete_notification(notification_id, caller_id=_caller_id(principal))
