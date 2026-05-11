"""
YouTube recommendation HTTP router.

Routes:
  POST /youtube/recommend        — Return one YouTube video for authenticated user's emotion.
  POST /youtube/report-failure   — Mark a video as failed (updates validator health state).
  POST /youtube/report-success   — Mark a video as successfully played + update play history.
  GET  /youtube/health           — Catalog health status per emotion (no auth required).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.features.auth.dependencies import get_current_user
from server.features.recommendations.youtube.schemas import (
    ReportFailureRequest,
    ReportSuccessRequest,
    ResetHistoryRequest,
    VideoHealthResponse,
    YouTubeRecommendationRequest,
    YouTubeRecommendationResponse,
)
from server.features.recommendations.youtube.service import YouTubeRecommendationService
from server.infra.cache.recommendation_store import RecommendationStore

youtube_router = APIRouter(prefix="/youtube", tags=["YouTube Recommendation"])


def _get_service(db: Session = Depends(get_db)) -> YouTubeRecommendationService:
    return YouTubeRecommendationService(RecommendationStore(db))


@youtube_router.post("/recommend", response_model=YouTubeRecommendationResponse)
def recommend(
    req: YouTubeRecommendationRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: YouTubeRecommendationService = Depends(_get_service),
) -> YouTubeRecommendationResponse:
    return svc.recommend(
        current_user["user_id"], req.emotion, req.session_id, req.excluded_video_ids
    )


@youtube_router.post("/report-failure", status_code=status.HTTP_204_NO_CONTENT)
def report_failure(
    req: ReportFailureRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: YouTubeRecommendationService = Depends(_get_service),
) -> None:
    svc.report_failure(req.youtube_video_id, req.error_code)


@youtube_router.post("/report-success", status_code=status.HTTP_204_NO_CONTENT)
def report_success(
    req: ReportSuccessRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: YouTubeRecommendationService = Depends(_get_service),
) -> None:
    svc.report_success(current_user["user_id"], req.youtube_video_id, req.emotion)


@youtube_router.post("/reset-history", status_code=status.HTTP_204_NO_CONTENT)
def reset_history(
    req: ResetHistoryRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: YouTubeRecommendationService = Depends(_get_service),
) -> None:
    svc.reset_history(current_user["user_id"], req.emotion)


@youtube_router.get("/health", response_model=VideoHealthResponse)
def health(svc: YouTubeRecommendationService = Depends(_get_service)) -> VideoHealthResponse:
    return svc.get_health_status()


@youtube_router.get("/emotions", response_model=list[str])
def get_supported_emotions() -> list[str]:
    from server.features.recommendations._shared import EMOTION_CATEGORIES
    return EMOTION_CATEGORIES


@youtube_router.get("/content-types", response_model=list[str])
def get_content_types() -> list[str]:
    # Hardcoded or derived from catalog, simplistic representation of what types existed in old codebase.
    return ["Music", "Meditation", "Motivation", "Podcast", "Meme", "Story", "Comedy"]


@youtube_router.get("/user-preferences/{user_id}", response_model=dict)
def get_user_preferences(
    user_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: YouTubeRecommendationService = Depends(_get_service),
) -> dict:
    if current_user.get("role") != "doctor" and current_user.get("user_id") != user_id:
        from server.exceptions import ForbiddenError
        raise ForbiddenError("Not authorized to view these preferences")
    return svc.get_preferences(user_id)
