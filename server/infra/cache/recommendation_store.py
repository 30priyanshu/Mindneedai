from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session


from server.db.models.recommendation import RecommendationSessionCache
from server.db.repositories.recommendation_repo import (
    RecommendationPlayHistoryRepository,
    SessionCacheRepository,
)


class RecommendationStore:
    """Thin facade wrapping recommendation caching storage requirements."""

    def __init__(self, db: Session):
        self.db = db
        self.play_repo = RecommendationPlayHistoryRepository(db)
        self.session_repo = SessionCacheRepository(db)

    def record_played(
        self, user_id: str, emotion: str, media_type: str, media_key: str
    ) -> None:
        """Record what play item the user just played."""
        self.play_repo.upsert(user_id, emotion, media_type, media_key)

    def get_played_keys(self, user_id: str, emotion: str, media_type: str) -> list[str]:
        """Fetch previously played keys to avoid recommending them again."""
        return self.play_repo.get_played_keys(user_id, emotion, media_type)

    def cache_session_choice(
        self,
        user_id: str,
        session_id: str,
        emotion: str,
        media_type: str,
        chosen_key: str,
    ) -> None:
        """Cache the specific recommendation chosen during this session."""
        self.session_repo.upsert(user_id, session_id, emotion, media_type, chosen_key)

    def get_session_choice(
        self, user_id: str, session_id: str, emotion: str, media_type: str
    ) -> Optional[str]:
        """Retrieve a cached session choice. Uses direct query since it's missing in repo."""
        stmt = (
            select(RecommendationSessionCache.chosen_key)
            .where(
                RecommendationSessionCache.user_id == user_id,
                RecommendationSessionCache.session_id == session_id,
                RecommendationSessionCache.emotion_category == emotion,
                RecommendationSessionCache.media_type == media_type,
            )
            .limit(1)
        )
        return self.db.scalar(stmt)

    def reset_user_play_history(
        self,
        user_id: str,
        media_type: str,
        emotion_category: Optional[str] = None,
    ) -> int:
        """Delete play history records for a user, optionally scoped to one emotion."""
        return self.play_repo.delete_user_history(user_id, media_type, emotion_category)

    def reset_user_session(self, user_id: str, media_type: Optional[str] = None) -> int:
        """
        Delete cached session choices for this user.
        Optionally scoped to one media type; uses user_id column directly (fixes Bug 0.1).
        """
        return self.session_repo.delete_user_sessions(user_id, media_type)
