"""
Login attempt tracking, rate limiting, and progressive account lockout management.
"""
import threading
import time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone

from loguru import logger

_failed_attempts: OrderedDict[str, dict] = OrderedDict()
_lock = threading.Lock()
MAX_ENTRIES = 10000
CLEANUP_INTERVAL = 300

class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Try again in {retry_after} seconds.")

def check_login_allowed(email: str) -> bool:
    """
    Check if account is locked due to failed attempts.
    """
    key = email.lower().strip()
    
    with _lock:
        if key not in _failed_attempts:
            return True
        
        _failed_attempts.move_to_end(key)
        attempts = _failed_attempts[key]
        
        locked_until = attempts.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < locked_until:
            return False
        
        if locked_until and datetime.now(timezone.utc) >= locked_until:
            attempts["count"] = 0
            attempts["locked_until"] = None
        
        return True

def get_lock_expiry(email: str) -> datetime | None:
    key = email.lower().strip()
    with _lock:
        if key in _failed_attempts:
            return _failed_attempts[key].get("locked_until")
    return None

def record_failed_login(email: str) -> None:
    """Record a failed login attempt and apply progressive lockout."""
    key = email.lower().strip()
    
    with _lock:
        if key in _failed_attempts:
            attempts = _failed_attempts[key]
            _failed_attempts.move_to_end(key)
        else:
            attempts = {"count": 0, "locked_until": None}
            
        attempts["count"] += 1
        
        # Progressive lockouts: 5 attempts -> 15 mins, 10 attempts -> 1 hour
        if attempts["count"] == 5:
            attempts["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
            logger.warning(f"Account {key} locked for 15 minutes due to 5 failed login attempts")
        elif attempts["count"] >= 10:
            attempts["locked_until"] = datetime.now(timezone.utc) + timedelta(hours=1)
            logger.warning(f"Account {key} locked for 1 hour due to >=10 failed login attempts")
            
        _failed_attempts[key] = attempts

def record_successful_login(email: str) -> None:
    """Reset failed attempt counter on successful login."""
    key = email.lower().strip()
    
    with _lock:
        if key in _failed_attempts:
            _failed_attempts[key] = {"count": 0, "locked_until": None}

def _cleanup_old_entries() -> None:
    """Background thread to clean up expired entries."""
    while True:
        time.sleep(CLEANUP_INTERVAL)
        with _lock:
            now = datetime.now(timezone.utc)
            keys_to_delete = []
            
            for key, data in list(_failed_attempts.items()):
                locked_until = data.get("locked_until")
                if locked_until and locked_until < now - timedelta(minutes=30):
                    keys_to_delete.append(key)
                elif data.get("count", 0) == 0:
                    keys_to_delete.append(key)
            
            while len(_failed_attempts) > MAX_ENTRIES:
                _failed_attempts.popitem(last=False)
            
            for key in keys_to_delete:
                _failed_attempts.pop(key, None)
            
            if keys_to_delete or len(_failed_attempts) > MAX_ENTRIES:
                logger.debug(f"Cleaned up {len(keys_to_delete)} expired login records")

_cleanup_thread = threading.Thread(target=_cleanup_old_entries, daemon=True)
_cleanup_thread.start()
