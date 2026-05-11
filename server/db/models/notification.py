from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Index

from server.db.base import Base

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index('idx_notif_user_read_created', 'user_id', 'read', 'created_at'),
        Index('idx_notif_doctor_read_created', 'doctor_id', 'read', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    doctor_id = Column(String(100), nullable=True, index=True)
    type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False, index=True)
    action_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
