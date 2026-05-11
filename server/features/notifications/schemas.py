from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


NotifType = Literal["info", "success", "warning", "analysis", "emergency"]


class NotificationResponse(BaseModel):
    notification_id: str
    type: str
    title: str
    message: str
    read: bool
    action_url: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    unread_count: int
