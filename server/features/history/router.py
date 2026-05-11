"""
Analysis History router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in HistoryService.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.session import get_db
from server.features.auth.dependencies import get_current_user
from server.features.history.schemas import AnalysisHistoryItem, HistoryResponse
from server.features.history.service import HistoryService

history_router = APIRouter(prefix="/users", tags=["history"])


def _get_service(db: Session = Depends(get_db)) -> HistoryService:
    return HistoryService(db=db)


@history_router.get("/history", response_model=HistoryResponse)
def get_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    modality: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    service: HistoryService = Depends(_get_service),
) -> HistoryResponse:
    """Return a paginated cross-modality analysis history for the authenticated user."""
    return service.get_history(current_user["user_id"], page, size, modality)


@history_router.delete(
    "/history/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["history"],
)
def delete_analysis(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    service: HistoryService = Depends(_get_service),
) -> None:
    """Delete a single analysis record (owner only)."""
    service.delete_analysis(current_user["user_id"], request_id)


@history_router.post("/history/clear", response_model=dict)
def clear_history(
    current_user: dict = Depends(get_current_user),
    service: HistoryService = Depends(_get_service),
) -> dict:
    """Delete all analysis history for the authenticated user. Returns deleted count."""
    return service.clear_history(current_user["user_id"])
