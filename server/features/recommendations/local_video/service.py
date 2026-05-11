"""
Local video recommendation service.

Single responsibility: emotion-to-video-file mapping with DB-backed play
history and session-scoped consistency.  No JSON files; all state via DB.
"""
from pathlib import Path

from loguru import logger

from server.config.settings import settings
from server.features.recommendations._shared import (
    EMOTION_CATEGORIES,
    make_selection_seed,
    normalize_emotion,
    select_from_pool,
)
from server.features.recommendations.local_video.schemas import VideoRecommendationResponse
from server.infra.cache.recommendation_store import RecommendationStore
from server.infra.media.catalog import LocalMediaCatalog, MediaCatalogConfig, validate_media_key

_MEDIA_TYPE = "video"
_VIDEO_EXTENSIONS = frozenset({".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"})


def _video_root() -> Path:
    root = Path(settings.media_root)
    if not root.is_absolute():
        root = Path(__file__).parents[4] / root
    return root / "videos"


_catalog = LocalMediaCatalog(
    MediaCatalogConfig(
        media_type=_MEDIA_TYPE,
        root=_video_root(),
        extensions=_VIDEO_EXTENSIONS,
        emotions=tuple(EMOTION_CATEGORIES),
    )
)


class LocalVideoRecommendationService:
    """Emotion → local video file mapping backed by DB play history."""

    def __init__(self, store: RecommendationStore) -> None:
        self._store = store

    def recommend(
        self, user_id: str, emotion: str, session_id: str | None
    ) -> VideoRecommendationResponse:
        category = normalize_emotion(emotion)
        available = _catalog.get().get(category, [])

        if not available:
            return VideoRecommendationResponse(
                success=False, video_file=None, emotion=category,
                total_videos=0, played_count=0,
                message=f"No videos available for {category}",
            )

        sid = session_id or "default"

        cached = self._store.get_session_choice(user_id, sid, category, _MEDIA_TYPE)
        if cached and cached in available:
            played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)
            return VideoRecommendationResponse(
                success=True, video_file=cached, emotion=category,
                total_videos=len(available), played_count=len(played), message=None,
            )

        played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)

        if len(played) >= len(available):
            self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
            played = []

        seed = make_selection_seed(_MEDIA_TYPE, user_id, sid, category)
        unplayed = [v for v in available if v not in played]
        video = select_from_pool(unplayed or available, seed)

        if not _catalog.exists(video):
            _catalog.invalidate()
            available = _catalog.get().get(category, [])
            if not available:
                return VideoRecommendationResponse(
                    success=False, video_file=None, emotion=category,
                    total_videos=0, played_count=0, message="No videos available after refresh",
                )
            played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)
            unplayed = [v for v in available if v not in played]
            video = select_from_pool(unplayed or available, seed)

        self._store.cache_session_choice(user_id, sid, category, _MEDIA_TYPE, video)
        logger.info("video_recommend", extra={"user_id": user_id, "emotion": category})
        return VideoRecommendationResponse(
            success=True, video_file=video, emotion=category,
            total_videos=len(available), played_count=len(played), message=None,
        )

    def report_played(self, user_id: str, emotion: str, video_file: str) -> None:
        category = normalize_emotion(emotion)
        self._store.record_played(user_id, category, _MEDIA_TYPE, validate_media_key(video_file))

    def report_failed(self, user_id: str, video_file: str) -> None:
        _catalog.mark_failed(video_file, user_id)

    def reset_history(self, user_id: str, emotion: str | None) -> None:
        category = normalize_emotion(emotion) if emotion else None
        self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
        self._store.reset_user_session(user_id, _MEDIA_TYPE)
