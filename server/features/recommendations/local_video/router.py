"""
Local video recommendation HTTP router.

Routes:
  POST /video/recommend       — Return one video for authenticated user's emotion.
  POST /video/report-played   — Mark a video as successfully played (idempotent upsert).
  POST /video/report-failed   — Mark a video as failed; invalidates catalog cache.
  POST /video/reset-history   — Clear play history (and session cache) for the user.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.features.auth.dependencies import get_current_user
from server.features.recommendations.local_video.schemas import (
    ReportFailedRequest,
    ReportPlayedRequest,
    ResetHistoryRequest,
    VideoRecommendationRequest,
    VideoRecommendationResponse,
)
from server.features.recommendations.local_video.service import LocalVideoRecommendationService
from server.infra.cache.recommendation_store import RecommendationStore

local_video_router = APIRouter(prefix="/video", tags=["Local Video Recommendation"])


def _get_service(db: Session = Depends(get_db)) -> LocalVideoRecommendationService:
    return LocalVideoRecommendationService(RecommendationStore(db))


@local_video_router.post("/recommend", response_model=VideoRecommendationResponse)
def recommend(
    req: VideoRecommendationRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: LocalVideoRecommendationService = Depends(_get_service),
) -> VideoRecommendationResponse:
    return svc.recommend(current_user["user_id"], req.emotion, req.session_id)


@local_video_router.post("/report-played", status_code=status.HTTP_204_NO_CONTENT)
def report_played(
    req: ReportPlayedRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: LocalVideoRecommendationService = Depends(_get_service),
) -> None:
    svc.report_played(current_user["user_id"], req.emotion, req.video_file)


@local_video_router.post("/report-failed", status_code=status.HTTP_204_NO_CONTENT)
def report_failed(
    req: ReportFailedRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: LocalVideoRecommendationService = Depends(_get_service),
) -> None:
    svc.report_failed(current_user["user_id"], req.video_file)


@local_video_router.post("/reset-history", status_code=status.HTTP_204_NO_CONTENT)
def reset_history(
    req: ResetHistoryRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    svc: LocalVideoRecommendationService = Depends(_get_service),
) -> None:
    svc.reset_history(current_user["user_id"], req.emotion)


@local_video_router.get("/emotions", response_model=list[str])
def get_supported_emotions() -> list[str]:
    from server.features.recommendations._shared import EMOTION_CATEGORIES
    return EMOTION_CATEGORIES
