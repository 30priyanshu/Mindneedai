from sqlalchemy import select
from sqlalchemy.orm import Session

from server.db.models.audio_analysis import AudioAnalysisSession, AudioAnalysisReview
from server.db.repositories.base import BaseRepository


class AudioSessionRepository(BaseRepository[AudioAnalysisSession]):
    def __init__(self, db: Session):
        super().__init__(AudioAnalysisSession, db)

    def find_by_session_id(self, session_id: str) -> AudioAnalysisSession | None:
        stmt = (
            select(AudioAnalysisSession)
            .where(AudioAnalysisSession.session_id == session_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_user(self, user_id: str, page: int = 1, size: int = 50) -> list[AudioAnalysisSession]:
        skip = (page - 1) * size
        stmt = (
            select(AudioAnalysisSession)
            .where(AudioAnalysisSession.user_id == user_id)
            .order_by(AudioAnalysisSession.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def list_sessions(self, status: str | None = None, page: int = 1, size: int = 50) -> list[AudioAnalysisSession]:
        skip = (page - 1) * size
        stmt = select(AudioAnalysisSession)
        if status:
            stmt = stmt.where(AudioAnalysisSession.status == status)
        stmt = stmt.order_by(AudioAnalysisSession.created_at.desc()).offset(skip).limit(size)
        return list(self.db.scalars(stmt).all())


class AudioAnalysisReviewRepository(BaseRepository[AudioAnalysisReview]):
    def __init__(self, db: Session):
        super().__init__(AudioAnalysisReview, db)

    def find_by_review_id(self, review_id: str) -> AudioAnalysisReview | None:
        stmt = (
            select(AudioAnalysisReview)
            .where(AudioAnalysisReview.review_id == review_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_session(self, session_id: str) -> list[AudioAnalysisReview]:
        stmt = (
            select(AudioAnalysisReview)
            .where(AudioAnalysisReview.session_id == session_id)
            .order_by(AudioAnalysisReview.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())
