from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, Text, JSON, Index

from server.db.base import Base

class HealthMetricsEntry(Base):
    __tablename__ = "health_metrics_entries"
    __table_args__ = (
        Index('idx_health_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_health_user_date', 'user_id', 'date'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    entry_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    oxygen_level = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    pulse_rate = Column(Integer, nullable=True)

    ai_analysis = Column(JSON, nullable=True)
    risk_level = Column(String(20), nullable=True, index=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
