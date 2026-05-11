from datetime import datetime, timedelta
from sqlalchemy import Column, DateTime, Integer, String, Index, UniqueConstraint

from server.db.base import Base

def _default_expires_at():
    return datetime.utcnow() + timedelta(hours=24)

class RecommendationPlayHistory(Base):
    __tablename__ = "recommendation_play_history"
    __table_args__ = (
        UniqueConstraint('user_id', 'emotion_category', 'media_type', 'media_key', name='uq_rec_history_user_emotion_media_key'),
        Index('idx_rec_history_user_played', 'user_id', 'played_at'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    media_type = Column(String(50), nullable=False, index=True)  # "music", "video", "youtube"
    emotion_category = Column(String(100), nullable=False, index=True)
    media_key = Column(String(255), nullable=False)
    played_at = Column(DateTime, default=datetime.utcnow, index=True)

class RecommendationSessionCache(Base):
    __tablename__ = "recommendation_session_cache"
    __table_args__ = (
        UniqueConstraint('user_id', 'session_id', 'emotion_category', 'media_type', name='uq_rec_cache_user_session_emotion_media'),
        Index('idx_rec_cache_expires_at', 'expires_at'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    emotion_category = Column(String(100), nullable=False, index=True)
    media_type = Column(String(50), nullable=False)
    chosen_key = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, default=_default_expires_at, index=True)
