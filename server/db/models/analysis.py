from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, JSON, Index

from server.db.base import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"
    __table_args__ = (
        Index('idx_analysis_user_created', 'user_id', 'created_at'),
        Index('idx_analysis_user_label', 'user_id', 'prediction_label'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    text_hash = Column(String(64), nullable=False)
    encrypted_text = Column(Text, nullable=True)
    prediction_label = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    requires_human_review = Column(Boolean, default=False, index=True)
    review_request_id = Column(String(100), nullable=True, index=True)
    consent_token = Column(Text, nullable=True)
    training_eligible = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    analysis_metadata = Column(JSON, nullable=True)

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    feedback_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    original_request_id = Column(String(100), nullable=False, index=True)
    feedback_type = Column(String(50), nullable=False, index=True)
    rating = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ReviewRecord(Base):
    __tablename__ = "review_records"
    __table_args__ = (
        Index('idx_review_status_created', 'status', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(String(100), unique=True, nullable=False, index=True)
    request_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    reviewer_id = Column(String(100), nullable=False, index=True)
    original_prediction = Column(String(50), nullable=False)
    human_assessment = Column(String(50), nullable=False)
    confidence_override = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    version_id = Column(String(100), unique=True, nullable=False, index=True)
    model_path = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=False, index=True)
    fine_tuned = Column(Boolean, default=False)
    performance_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
