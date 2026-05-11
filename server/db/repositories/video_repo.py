from sqlalchemy import select
from sqlalchemy.orm import Session

from server.db.models.video_analysis import VideoAnalysisSession, VideoFrameRecord, VideoAnalysisReview
from server.db.repositories.base import BaseRepository


class VideoSessionRepository(BaseRepository[VideoAnalysisSession]):
    def __init__(self, db: Session):
        super().__init__(VideoAnalysisSession, db)

    def find_by_session_id(self, session_id: str) -> VideoAnalysisSession | None:
        stmt = (
            select(VideoAnalysisSession)
            .where(VideoAnalysisSession.session_id == session_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_user(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> list[VideoAnalysisSession]:
        stmt = (
            select(VideoAnalysisSession)
            .where(VideoAnalysisSession.user_id == user_id)
            .order_by(VideoAnalysisSession.start_time.desc())
            .offset(offset)
            .limit(min(limit, 100))
        )
        return list(self.db.scalars(stmt).all())


class VideoFrameRepository(BaseRepository[VideoFrameRecord]):
    def __init__(self, db: Session):
        super().__init__(VideoFrameRecord, db)

    def list_by_session(self, session_id: str) -> list[VideoFrameRecord]:
        stmt = (
            select(VideoFrameRecord)
            .where(VideoFrameRecord.session_id == session_id)
            .order_by(VideoFrameRecord.frame_number.asc())
        )
        return list(self.db.scalars(stmt).all())

class VideoAnalysisReviewRepository(BaseRepository[VideoAnalysisReview]):
    def __init__(self, db: Session):
        super().__init__(VideoAnalysisReview, db)

    def find_by_review_id(self, review_id: str) -> VideoAnalysisReview | None:
        stmt = (
            select(VideoAnalysisReview)
            .where(VideoAnalysisReview.review_id == review_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_session(self, session_id: str) -> list[VideoAnalysisReview]:
        stmt = (
            select(VideoAnalysisReview)
            .where(VideoAnalysisReview.session_id == session_id)
            .order_by(VideoAnalysisReview.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())
