"""Authorization helpers — ownership checks for analysis sessions/resources."""
from __future__ import annotations

from server.exceptions import ForbiddenError


def require_owner(resource_user_id: str | None, current_user_id: str) -> None:
    if not resource_user_id or resource_user_id != current_user_id:
        raise ForbiddenError("You do not own this resource")
