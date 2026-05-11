"""In-process token-bucket rate limiter.

Lightweight per-(scope, key) limiter sized for a single uvicorn worker behind
sticky-session ALB (matches the deployment target documented in the hardening
plan). When ``settings.redis_url`` is configured and ``fastapi-limiter`` is
installed, callers can swap in a Redis-backed limiter without touching
handler signatures because the dependency returns the same FastAPI dep type.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Callable, Tuple

from fastapi import Depends, Request

from server.exceptions import RateLimitError
from server.features.auth.dependencies import get_current_user


class _TokenBucket:
    __slots__ = ("capacity", "refill_per_s", "tokens", "updated_at")

    def __init__(self, capacity: float, refill_per_s: float) -> None:
        self.capacity = capacity
        self.refill_per_s = refill_per_s
        self.tokens = capacity
        self.updated_at = time.monotonic()

    def consume(self, amount: float = 1.0) -> bool:
        now = time.monotonic()
        elapsed = now - self.updated_at
        self.updated_at = now
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_per_s)
        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False


class _RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[Tuple[str, str], _TokenBucket] = defaultdict(lambda: _TokenBucket(1, 1))
        self._configs: dict[str, Tuple[float, float]] = {}
        self._lock = Lock()

    def configure(self, scope: str, capacity: float, refill_per_s: float) -> None:
        self._configs[scope] = (capacity, refill_per_s)

    def check(self, scope: str, key: str) -> bool:
        cfg = self._configs.get(scope)
        if not cfg:
            return True
        with self._lock:
            bucket = self._buckets.get((scope, key))
            if bucket is None or bucket.capacity != cfg[0] or bucket.refill_per_s != cfg[1]:
                bucket = _TokenBucket(cfg[0], cfg[1])
                self._buckets[(scope, key)] = bucket
            return bucket.consume(1.0)


_limiter = _RateLimiter()


def configure_rate_limit(scope: str, capacity: float, refill_per_s: float) -> None:
    _limiter.configure(scope, capacity, refill_per_s)


def rate_limit(scope: str) -> Callable[..., None]:
    """FastAPI dependency factory enforcing a per-user token bucket for ``scope``.

    Falls back to client IP when authentication is absent (e.g. anonymous
    routes), guaranteeing every request is bucketed.
    """

    def _dep(request: Request, current_user: dict = Depends(get_current_user)) -> None:
        key = current_user.get("user_id") or _client_ip(request)
        if not _limiter.check(scope, key):
            raise RateLimitError(f"{scope} rate limit exceeded")

    return _dep


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",", 1)[0].strip()
    return request.client.host if request.client else "anon"
