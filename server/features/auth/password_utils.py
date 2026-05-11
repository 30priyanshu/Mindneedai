"""
Password hashing and verification utilities using bcrypt.
"""
import time

import bcrypt
from loguru import logger

from server.exceptions import ValidationError

COMMON_PASSWORDS = frozenset({
    "password", "password123", "12345678", "qwerty123", "abc12345",
    "welcome123", "admin123", "letmein123", "monkey123", "dragon123"
})


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with 72-byte limit enforcement.
    """
    try:
        password_bytes = password.encode("utf-8")
        
        if len(password_bytes) > 72:
            logger.warning(f"Password exceeds 72 bytes ({len(password_bytes)} bytes), truncating to 72 bytes")
            password_bytes = password_bytes[:72]
        
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        return hashed.decode("utf-8")
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash using constant-time comparison.
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        
        if len(password_bytes) > 72:
            logger.warning("Password verification: truncating to 72 bytes")
            password_bytes = password_bytes[:72]
        
        hashed_bytes = hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
        
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        time.sleep(0.01)
        return False


def validate_strength(password: str) -> None:
    """
    Validate password strength. Raises ValidationError if weak.
    """
    password_lower = password.lower().strip()
    
    if password_lower in COMMON_PASSWORDS:
        raise ValidationError("Password is too common. Please choose a more unique password.")
    
    if len(password_lower) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    
    if len(password.encode("utf-8")) > 72:
        raise ValidationError("Password is too long (maximum 72 bytes)")
    
    if not any(c.isupper() for c in password):
        raise ValidationError("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        raise ValidationError("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        raise ValidationError("Password must contain at least one number")
    
    if len(set(password)) < 4:
        raise ValidationError("Password must contain at least 4 unique characters")
