"""
Music recommendation HTTP router.

Routes:
  POST /music/recommend       — Return one track for authenticated user's emotion.
  POST /music/report-played   — Mark a track as successfully played (idempotent upsert).
  POST /music/report-failed   — Mark a track as failed; invalidates catalog cache.
  POST /music/reset-history   — Clear play history (and session cache) for the user.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.features.auth.dependencies import get_current_user
from server.features.recommendations.music.schemas import (
    MusicRecommendationRequest,
    MusicRecommendationResponse,
    ReportFailedRequest,
    ReportPlayedRequest,
    ResetHistoryRequest,
)
from server.features.recommendations.music.service import MusicRecommendationService
from server.infra.cache.recommendation_store import RecommendationStore

music_router = APIRouter(prefix="/music", tags=["Music Recommendation"])


def _get_service(db: Session = Depends(get_db)) -> MusicRecommendationService:
    return MusicRecommendationService(RecommendationStore(db))


@music_router.post("/recommend", response_model=MusicRecommendationResponse)
def recommend(
    req: MusicRecommendationRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: MusicRecommendationService = Depends(_get_service),
) -> MusicRecommendationResponse:
    return svc.recommend(current_user["user_id"], req.emotion, req.session_id)


@music_router.post("/report-played", status_code=status.HTTP_204_NO_CONTENT)
def report_played(
    req: ReportPlayedRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: MusicRecommendationService = Depends(_get_service),
) -> None:
    svc.report_played(current_user["user_id"], req.emotion, req.music_file)


@music_router.post("/report-failed", status_code=status.HTTP_204_NO_CONTENT)
def report_failed(
    req: ReportFailedRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: MusicRecommendationService = Depends(_get_service),
) -> None:
    svc.report_failed(current_user["user_id"], req.music_file)


@music_router.post("/reset-history", status_code=status.HTTP_204_NO_CONTENT)
def reset_history(
    req: ResetHistoryRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: MusicRecommendationService = Depends(_get_service),
) -> None:
    svc.reset_history(current_user["user_id"], req.emotion)


@music_router.get("/emotions", response_model=list[str])
def get_supported_emotions() -> list[str]:
    from server.features.recommendations._shared import EMOTION_CATEGORIES
    return EMOTION_CATEGORIES
