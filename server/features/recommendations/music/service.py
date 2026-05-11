"""
Music recommendation service.

Single responsibility: emotion-to-audio-track mapping with DB-backed play
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
from server.features.recommendations.music.schemas import MusicRecommendationResponse
from server.infra.cache.recommendation_store import RecommendationStore
from server.infra.media.catalog import LocalMediaCatalog, MediaCatalogConfig, validate_media_key

_MEDIA_TYPE = "music"
_AUDIO_EXTENSIONS = frozenset({".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"})


def _music_root() -> Path:
    root = Path(settings.media_root)
    if not root.is_absolute():
        root = Path(__file__).parents[4] / root
    return root / "music"


_catalog = LocalMediaCatalog(
    MediaCatalogConfig(
        media_type=_MEDIA_TYPE,
        root=_music_root(),
        extensions=_AUDIO_EXTENSIONS,
        emotions=tuple(EMOTION_CATEGORIES),
    )
)


class MusicRecommendationService:
    """Emotion → audio track mapping backed by DB play history."""

    def __init__(self, store: RecommendationStore) -> None:
        self._store = store

    def recommend(
        self, user_id: str, emotion: str, session_id: str | None
    ) -> MusicRecommendationResponse:
        category = normalize_emotion(emotion)
        available = _catalog.get().get(category, [])

        if not available:
            return MusicRecommendationResponse(
                success=False, music_file=None, emotion=category,
                total_tracks=0, played_count=0,
                message=f"No music available for {category}",
            )

        sid = session_id or "default"

        cached = self._store.get_session_choice(user_id, sid, category, _MEDIA_TYPE)
        if cached and cached in available:
            played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)
            return MusicRecommendationResponse(
                success=True, music_file=cached, emotion=category,
                total_tracks=len(available), played_count=len(played), message=None,
            )

        played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)

        if len(played) >= len(available):
            self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
            played = []

        seed = make_selection_seed(_MEDIA_TYPE, user_id, sid, category)
        unplayed = [t for t in available if t not in played]
        track = select_from_pool(unplayed or available, seed)

        if not _catalog.exists(track):
            _catalog.invalidate()
            available = _catalog.get().get(category, [])
            if not available:
                return MusicRecommendationResponse(
                    success=False, music_file=None, emotion=category,
                    total_tracks=0, played_count=0, message="No music available after refresh",
                )
            played = self._store.get_played_keys(user_id, category, _MEDIA_TYPE)
            unplayed = [t for t in available if t not in played]
            track = select_from_pool(unplayed or available, seed)

        self._store.cache_session_choice(user_id, sid, category, _MEDIA_TYPE, track)
        logger.info("music_recommend", extra={"user_id": user_id, "emotion": category})
        return MusicRecommendationResponse(
            success=True, music_file=track, emotion=category,
            total_tracks=len(available), played_count=len(played), message=None,
        )

    def report_played(self, user_id: str, emotion: str, music_file: str) -> None:
        category = normalize_emotion(emotion)
        self._store.record_played(user_id, category, _MEDIA_TYPE, validate_media_key(music_file))

    def report_failed(self, user_id: str, music_file: str) -> None:
        _catalog.mark_failed(music_file, user_id)

    def reset_history(self, user_id: str, emotion: str | None) -> None:
        category = normalize_emotion(emotion) if emotion else None
        self._store.reset_user_play_history(user_id, _MEDIA_TYPE, category)
        self._store.reset_user_session(user_id, _MEDIA_TYPE)
