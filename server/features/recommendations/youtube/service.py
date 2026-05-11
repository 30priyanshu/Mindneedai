"""
YouTube recommendation service.

Single responsibility: emotion-to-YouTube-video mapping with DB-backed play
history, session-scoped consistency, and in-memory health validation.
"""
from typing import Optional

from loguru import logger

from server.features.recommendations._shared import (
    make_selection_seed,
    normalize_emotion,
    select_from_pool,
)
from server.features.recommendations.youtube.catalog import EMOTION_VIDEO_CATALOG, VideoEntry
from server.features.recommendations.youtube.schemas import (
    EmotionHealthEntry,
    VideoHealthResponse,
    YouTubeRecommendationResponse,
)
from server.features.recommendations.youtube.validator import youtube_validator
from server.infra.cache.recommendation_store import RecommendationStore

_MEDIA_TYPE = "youtube"
_BEST_CANDIDATE_POOL = 5  # top-scored healthy videos considered for selection


def _videos_for(emotion: str) -> list[VideoEntry]:
    return list(EMOTION_VIDEO_CATALOG.get(emotion, []))


class YouTubeRecommendationService:
    """Emotion → curated YouTube video mapping backed by DB play history."""

    def __init__(self, store: RecommendationStore) -> None:
        self._store = store

    def recommend(
        self,
        user_id: str,
        emotion: str,
        session_id: Optional[str],
        excluded_video_ids: list[str],
    ) -> YouTubeRecommendationResponse:
        category = normalize_emotion(emotion)
        all_videos = _videos_for(category)

        if not all_videos:
            return self._no_content(category, 0, "No content available")

        healthy = youtube_validator.filter_available(all_videos)
        if excluded_video_ids:
            healthy = [v for v in healthy if v["youtube_video_id"] not in excluded_video_ids]

        if not healthy:
            return self._no_content(category, len(all_videos), "Content temporarily unavailable")

        sid = session_id or "default"

        cached_id = self._store.get_session_choice(user_id, sid, category, _MEDIA_TYPE)
        if cached_id:
            cached_video = next((v for v in healthy if v["youtube_video_id"] == cached_id), None)
            if cached_video:
                played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)
                return self._success(cached_video, category, len(healthy), len(played))

        played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)

        if len(played) >= len(healthy):
            self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
            played = []

        unplayed = [v for v in healthy if v["youtube_video_id"] not in played]
        pool = unplayed or healthy

        candidates = youtube_validator.get_best(pool, limit=min(_BEST_CANDIDATE_POOL, len(pool)))
        if not candidates:
            candidates = pool

        seed = make_selection_seed(_MEDIA_TYPE, user_id, sid, category)
        selected = select_from_pool([v["youtube_video_id"] for v in candidates], seed)
        video = next(v for v in candidates if v["youtube_video_id"] == selected)

        self._store.cache_session_choice(user_id, sid, category, _MEDIA_TYPE, selected)
        logger.info("youtube_recommend", extra={"user_id": user_id, "emotion": category, "video_id": selected})
        return self._success(video, category, len(healthy), len(played))

    def report_failure(self, video_id: str, error_code: Optional[int]) -> None:
        youtube_validator.mark_failed(video_id, error_code)
        logger.warning("youtube_video_failed", extra={"video_id": video_id, "error_code": error_code})

    def report_success(self, user_id: str, video_id: str, emotion: str) -> None:
        youtube_validator.mark_success(video_id)
        category = normalize_emotion(emotion)
        self._store.record_played(user_id, category, _MEDIA_TYPE, video_id)

    def reset_history(self, user_id: str, emotion: Optional[str]) -> None:
        category = normalize_emotion(emotion) if emotion else None
        self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
        self._store.reset_user_session(user_id, _MEDIA_TYPE)

    def get_health_status(self) -> VideoHealthResponse:
        all_ids: set[str] = set()
        emotion_breakdown: dict[str, EmotionHealthEntry] = {}

        for emotion, videos in EMOTION_VIDEO_CATALOG.items():
            ids = [v["youtube_video_id"] for v in videos]
            all_ids.update(ids)
            available = sum(1 for vid in ids if youtube_validator.is_available(vid))
            total = len(ids)
            emotion_breakdown[emotion] = EmotionHealthEntry(
                total=total,
                available=available,
                health_percentage=(available / total * 100) if total else 0.0,
            )

        total = len(all_ids)
        available = sum(1 for vid in all_ids if youtube_validator.is_available(vid))
        return VideoHealthResponse(
            total_videos=total,
            available_videos=available,
            unavailable_videos=total - available,
            overall_health_percentage=(available / total * 100) if total else 0.0,
            emotion_breakdown=emotion_breakdown,
        )

    @staticmethod
    def _no_content(emotion: str, total: int, message: str) -> YouTubeRecommendationResponse:
        return YouTubeRecommendationResponse(
            success=False, youtube_video_id=None, title=None, content_type=None,
            emotion=emotion, total_videos=total, played_count=0, message=message,
        )

    @staticmethod
    def _success(
        video: VideoEntry, emotion: str, total: int, played: int
    ) -> YouTubeRecommendationResponse:
        return YouTubeRecommendationResponse(
            success=True,
            youtube_video_id=video["youtube_video_id"],
            title=video["title"],
            content_type=video.get("type"),
            emotion=emotion,
            total_videos=total,
            played_count=played,
            message=None,
        )

    def get_preferences(self, user_id: str) -> dict:
        """Fetch user preferences for YouTube recommendations. Stubbed to empty dict for now."""
        # This would normally query the database, for now returning structural default
        return {
            "user_id": user_id,
            "preferred_content_types": [],
            "excluded_video_ids": []
        }
