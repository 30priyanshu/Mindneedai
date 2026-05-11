from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Integer, String, Text, JSON, Index

from server.db.base import Base

class MentalWellnessForm(Base):
    __tablename__ = "mental_wellness_forms"
    __table_args__ = (
        Index('idx_well_form_doctor_user_status', 'doctor_id', 'user_id', 'status'),
        Index('idx_well_form_user_status_date', 'user_id', 'status', 'form_date'),
        Index('idx_well_form_user_ai_status', 'user_id', 'ai_generation_status', 'form_date'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    doctor_id = Column(String(100), nullable=False, index=True)
    client_name = Column(String(255), nullable=False)
    form_date = Column(Date, nullable=False, index=True)
    form_data = Column(JSON, nullable=False)
    status = Column(String(50), default='submitted', nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    
    ai_summary_clinical = Column(Text, nullable=True)
    ai_summary_patient = Column(Text, nullable=True)
    ai_patterns_detected = Column(JSON, nullable=True)
    ai_generated_at = Column(DateTime, nullable=True)
    ai_model_version = Column(String(50), nullable=True)
    ai_generation_status = Column(String(50), default='pending', nullable=False, index=True)
    ai_error_message = Column(Text, nullable=True)
    ai_summary_version = Column(Integer, default=0, nullable=False)
    ai_regenerated_count = Column(Integer, default=0, nullable=False)
    form_data_hash = Column(String(64), nullable=True, index=True)
    ai_report_status = Column(String(50), default='pending_review', nullable=False, index=True)
    ai_report_sent_at = Column(DateTime, nullable=True)
    ai_report_sent_by = Column(String(100), nullable=True)
