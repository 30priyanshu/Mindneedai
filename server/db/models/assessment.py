from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, JSON, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from server.db.base import Base

class AssessmentRequest(Base):
    __tablename__ = "assessment_requests"
    __table_args__ = (
        Index('idx_assess_req_patient_status', 'patient_id', 'status'),
        Index('idx_assess_req_doctor_patient', 'doctor_id', 'patient_id'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(100), unique=True, nullable=False, index=True)
    doctor_id = Column(String(100), nullable=False, index=True)
    patient_id = Column(String(100), nullable=False, index=True)
    assessment_type = Column(String(10), nullable=False, index=True)
    status = Column(String(50), default='pending', nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    doctor = relationship(
        "Doctor",
        primaryjoin="foreign(AssessmentRequest.doctor_id) == remote(Doctor.doctor_id)",
        backref="assessment_requests"
    )
    patient = relationship(
        "UserProfile",
        primaryjoin="foreign(AssessmentRequest.patient_id) == remote(UserProfile.user_id)",
        backref="assessment_requests"
    )

class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = (
        Index('idx_assess_user_type_date', 'user_id', 'assessment_type', 'created_at'),
        Index('idx_assess_user_date', 'user_id', 'created_at'),
        Index('idx_assess_request_id', 'assessment_request_id'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    assessment_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    assessment_type = Column(String(10), nullable=False, index=True)
    assessment_request_id = Column(String(100), nullable=True, index=True)
    score = Column(Integer, nullable=False)
    severity_level = Column(String(50), nullable=False, index=True)
    severity_label = Column(String(100), nullable=False)
    treatment_recommendations = Column(JSON, nullable=False)
    responses = Column(JSON, nullable=False)
    visible_to_patient = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
