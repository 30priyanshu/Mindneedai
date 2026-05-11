from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, JSON, Index

from server.db.base import Base

class VideoAnalysisSession(Base):
    __tablename__ = "video_analysis_sessions"
    __table_args__ = (
        Index('idx_video_sess_user_created', 'user_id', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_frames = Column(Integer, default=0)
    average_confidence = Column(Float, nullable=True)
    dominant_emotion = Column(String(50), nullable=True)
    requires_human_review = Column(Boolean, default=False)
    review_request_id = Column(String(100), nullable=True, index=True)
    session_file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    analysis_metadata = Column(JSON, nullable=True)

class VideoFrameRecord(Base):
    __tablename__ = "video_frame_records"
    __table_args__ = (
        Index('idx_video_frame_session', 'session_id'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    frame_id = Column(String(100), unique=True, nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    frame_number = Column(Integer, nullable=False)
    timestamp = Column(Float, nullable=False)
    emotion_detected = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    face_detected = Column(Boolean, default=True)
    frame_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VideoAnalysisReview(Base):
    __tablename__ = "video_analysis_reviews"
    __table_args__ = (
        Index('idx_video_review_session', 'session_id'),
        Index('idx_video_review_status', 'status'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(String(100), unique=True, nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    reviewer_id = Column(String(100), nullable=False, index=True)
    ai_summary = Column(Text, nullable=True)
    dominant_emotion_ai = Column(String(50), nullable=False)
    dominant_emotion_human = Column(String(50), nullable=True)
    emotional_patterns = Column(JSON, nullable=True)
    review_notes = Column(Text, nullable=True)
    confidence_override = Column(Float, nullable=True)
    status = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
