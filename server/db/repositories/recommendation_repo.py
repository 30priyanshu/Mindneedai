from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.db.models.recommendation import (
    RecommendationPlayHistory,
    RecommendationSessionCache,
)
from server.db.repositories.base import BaseRepository


class RecommendationPlayHistoryRepository(BaseRepository[RecommendationPlayHistory]):
    def __init__(self, db: Session):
        super().__init__(RecommendationPlayHistory, db)

    def upsert(
        self,
        user_id: str,
        emotion_category: str,
        media_type: str,
        media_key: str,
    ) -> RecommendationPlayHistory:
        stmt = (
            select(RecommendationPlayHistory)
            .where(
                RecommendationPlayHistory.user_id == user_id,
                RecommendationPlayHistory.emotion_category == emotion_category,
                RecommendationPlayHistory.media_type == media_type,
                RecommendationPlayHistory.media_key == media_key,
            )
            .limit(1)
        )
        record = self.db.scalar(stmt)

        if record:
            record.played_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(record)
            return record

        record = RecommendationPlayHistory(
            user_id=user_id,
            emotion_category=emotion_category,
            media_type=media_type,
            media_key=media_key,
        )
        self.db.add(record)
        try:
            self.db.commit()
            self.db.refresh(record)
            return record
        except IntegrityError:
            self.db.rollback()
            record = self.db.scalar(stmt)
            if record:
                record.played_at = datetime.now(timezone.utc)
                self.db.commit()
                self.db.refresh(record)
                return record
            raise

    def get_played_keys(
        self, user_id: str, emotion_category: str, media_type: str
    ) -> list[str]:
        stmt = select(RecommendationPlayHistory.media_key).where(
            RecommendationPlayHistory.user_id == user_id,
            RecommendationPlayHistory.emotion_category == emotion_category,
            RecommendationPlayHistory.media_type == media_type,
        )
        return list(self.db.scalars(stmt).all())

    def delete_user_history(
        self,
        user_id: str,
        media_type: str,
        emotion_category: Optional[str] = None,
    ) -> int:
        """Delete play history for a user, optionally scoped to one emotion category."""
        conditions = [
            RecommendationPlayHistory.user_id == user_id,
            RecommendationPlayHistory.media_type == media_type,
        ]
        if emotion_category:
            conditions.append(RecommendationPlayHistory.emotion_category == emotion_category)
        stmt = delete(RecommendationPlayHistory).where(*conditions)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount  # type: ignore[return-value]


class SessionCacheRepository(BaseRepository[RecommendationSessionCache]):
    def __init__(self, db: Session):
        super().__init__(RecommendationSessionCache, db)

    def upsert(
        self,
        user_id: str,
        session_id: str,
        emotion_category: str,
        media_type: str,
        chosen_key: str,
    ) -> RecommendationSessionCache:
        stmt = (
            select(RecommendationSessionCache)
            .where(
                RecommendationSessionCache.user_id == user_id,
                RecommendationSessionCache.session_id == session_id,
                RecommendationSessionCache.emotion_category == emotion_category,
                RecommendationSessionCache.media_type == media_type,
            )
            .limit(1)
        )
        record = self.db.scalar(stmt)

        if record:
            record.chosen_key = chosen_key
            record.created_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(record)
            return record

        record = RecommendationSessionCache(
            user_id=user_id,
            session_id=session_id,
            emotion_category=emotion_category,
            media_type=media_type,
            chosen_key=chosen_key,
        )
        self.db.add(record)
        try:
            self.db.commit()
            self.db.refresh(record)
            return record
        except IntegrityError:
            self.db.rollback()
            record = self.db.scalar(stmt)
            if record:
                record.chosen_key = chosen_key
                record.created_at = datetime.now(timezone.utc)
                self.db.commit()
                self.db.refresh(record)
                return record
            raise

    def delete_user_sessions(
        self, user_id: str, media_type: Optional[str] = None
    ) -> int:
        """Delete session cache entries for a user, optionally scoped to one media type."""
        conditions = [RecommendationSessionCache.user_id == user_id]
        if media_type:
            conditions.append(RecommendationSessionCache.media_type == media_type)
        stmt = delete(RecommendationSessionCache).where(*conditions)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount  # type: ignore[return-value]

    def expire_old_rows(self) -> int:
        stmt = delete(RecommendationSessionCache).where(
            RecommendationSessionCache.expires_at < datetime.now(timezone.utc)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount  # type: ignore[return-value]
