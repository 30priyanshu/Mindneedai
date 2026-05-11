from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Index, UniqueConstraint

from server.db.base import Base

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, unique=True, index=True)
    doctor_enabled = Column(Boolean, default=False, nullable=False)
    doctor_email = Column(String(255), nullable=True)
    loved_one_enabled = Column(Boolean, default=False, nullable=False)
    loved_one_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmergencyAlertLog(Base):
    __tablename__ = "emergency_alert_logs"
    __table_args__ = (
        Index('idx_emerg_alert_user_time', 'user_id', 'triggered_at'),
        Index('idx_emerg_alert_user_status', 'user_id', 'alert_status'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False, index=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    doctor_notified = Column(Boolean, default=False, nullable=False)
    loved_one_notified = Column(Boolean, default=False, nullable=False)
    emergency_condition = Column(String(100), nullable=True)
    risk_score = Column(Float, nullable=True)
    alert_status = Column(String(50), default="sent", nullable=False, index=True)
