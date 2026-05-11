from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from server.db.base import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"
    __table_args__ = (
        UniqueConstraint('email', name='uq_user_profile_email'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=True, unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)
    role = Column(String(50), default='user', nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        UniqueConstraint('email', name='uq_doctor_email'),
        UniqueConstraint('doctor_code', name='uq_doctor_code'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    doctor_id = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), nullable=True)
    specialty = Column(String(100), nullable=True, index=True)
    location = Column(String(255), nullable=True)
    verification_status = Column(String(50), default='verified', nullable=False, index=True)
    doctor_code = Column(String(6), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, unique=True, index=True)
    fontSize = Column(String(20), default='normal', nullable=False)
    highContrast = Column(Boolean, default=False, nullable=False)
    reduceMotion = Column(Boolean, default=False, nullable=False)
    textToSpeech = Column(Boolean, default=False, nullable=False)
    autoSave = Column(Boolean, default=True, nullable=False)
    notifications = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserDoctorRelationship(Base):
    __tablename__ = "user_doctor_relationships"
    __table_args__ = (
        UniqueConstraint('user_id', 'doctor_id', name='uq_user_doctor'),
        Index('idx_user_doctor_rel_doctor_status', 'doctor_id', 'status'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    doctor_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default='active', nullable=False, index=True)
    connection_method = Column(String(50), nullable=True)
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    disconnected_at = Column(DateTime, nullable=True)
    
    user = relationship(
        "UserProfile",
        primaryjoin="foreign(UserDoctorRelationship.user_id) == remote(UserProfile.user_id)",
        backref="doctor_relationships"
    )
    doctor = relationship(
        "Doctor",
        primaryjoin="foreign(UserDoctorRelationship.doctor_id) == remote(Doctor.doctor_id)",
        backref="patient_relationships"
    )
