"""Bounded async wrapper around synchronous CPU/GPU inference calls.

One semaphore caps concurrent threads per modality; an optional internal lock
serialises calls into libraries that are not thread-safe (mediapipe). Latency,
queue depth, and failure counters are exposed for /api/v1/llm/metrics.
"""
from __future__ import annotations

import asyncio
import time
from contextlib import asynccontextmanager
from typing import Any, Awaitable, Callable, TypeVar

from loguru import logger

from server.config.settings import settings
from server.exceptions import InferenceTimeoutError, ModelNotLoadedError

T = TypeVar("T")


class _RunnerMetrics:
    __slots__ = ("_lock", "_in_flight", "_waiters", "_total", "_failed", "_latencies")

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._in_flight = 0
        self._waiters = 0
        self._total = 0
        self._failed = 0
        self._latencies: list[float] = []

    async def waiter_inc(self) -> None:
        async with self._lock:
            self._waiters += 1

    async def waiter_dec_inflight_inc(self) -> None:
        async with self._lock:
            self._waiters = max(0, self._waiters - 1)
            self._in_flight += 1

    async def record(self, latency_ms: float, ok: bool) -> None:
        async with self._lock:
            self._in_flight = max(0, self._in_flight - 1)
            self._total += 1
            if not ok:
                self._failed += 1
            self._latencies.append(latency_ms)
            if len(self._latencies) > 500:
                self._latencies = self._latencies[-500:]

    def snapshot(self) -> dict[str, Any]:
        lats = self._latencies or [0.0]
        s = sorted(lats)
        n = len(s)
        return {
            "in_flight": self._in_flight,
            "queue_waiters": self._waiters,
            "total": self._total,
            "failed": self._failed,
            "latency_p50_ms": s[n // 2],
            "latency_p99_ms": s[min(int(n * 0.99), n - 1)],
        }


class InferenceRunner:
    """Per-modality concurrency gate with timeout, off-loop execution, metrics."""

    __slots__ = ("name", "_sem", "_serial_lock", "_timeout_s", "metrics")

    def __init__(self, name: str, max_concurrency: int, timeout_s: int, *, serialize: bool = False) -> None:
        self.name = name
        self._sem = asyncio.Semaphore(max(1, max_concurrency))
        self._serial_lock: asyncio.Lock | None = asyncio.Lock() if serialize else None
        self._timeout_s = timeout_s
        self.metrics = _RunnerMetrics()

    @asynccontextmanager
    async def _gate(self):
        await self.metrics.waiter_inc()
        async with self._sem:
            await self.metrics.waiter_dec_inflight_inc()
            if self._serial_lock is not None:
                async with self._serial_lock:
                    yield
            else:
                yield

    async def run(self, fn: Callable[..., T], /, *args: Any, request_id: str = "", **kwargs: Any) -> T:
        t0 = time.perf_counter()
        ok = False
        try:
            async with self._gate():
                try:
                    result = await asyncio.wait_for(
                        asyncio.to_thread(fn, *args, **kwargs),
                        timeout=self._timeout_s,
                    )
                    ok = True
                    return result
                except asyncio.TimeoutError as exc:
                    logger.warning(
                        "inference_timeout",
                        extra={"runner": self.name, "request_id": request_id, "timeout_s": self._timeout_s},
                    )
                    raise InferenceTimeoutError(f"{self.name} inference exceeded {self._timeout_s}s") from exc
        finally:
            await self.metrics.record((time.perf_counter() - t0) * 1000, ok)

    async def run_async(self, coro_fn: Callable[..., Awaitable[T]], /, *args: Any, request_id: str = "", **kwargs: Any) -> T:
        t0 = time.perf_counter()
        ok = False
        try:
            async with self._gate():
                try:
                    result = await asyncio.wait_for(coro_fn(*args, **kwargs), timeout=self._timeout_s)
                    ok = True
                    return result
                except asyncio.TimeoutError as exc:
                    logger.warning(
                        "inference_timeout",
                        extra={"runner": self.name, "request_id": request_id, "timeout_s": self._timeout_s},
                    )
                    raise InferenceTimeoutError(f"{self.name} inference exceeded {self._timeout_s}s") from exc
        finally:
            await self.metrics.record((time.perf_counter() - t0) * 1000, ok)


text_runner = InferenceRunner("text", settings.text_inference_concurrency, settings.inference_timeout)
speech_runner = InferenceRunner("speech", settings.speech_inference_concurrency, settings.inference_timeout)
facial_runner = InferenceRunner("facial", settings.facial_inference_concurrency, settings.inference_timeout)


def metrics() -> dict[str, Any]:
    return {
        "text": text_runner.metrics.snapshot(),
        "speech": speech_runner.metrics.snapshot(),
        "facial": facial_runner.metrics.snapshot(),
    }


def require_loaded(analyzer: Any, name: str) -> None:
    if not getattr(analyzer, "is_loaded", False):
        raise ModelNotLoadedError(f"{name} model not loaded")
