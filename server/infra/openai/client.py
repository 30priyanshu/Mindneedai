import asyncio
import logging
import time
from typing import Any

import httpx
import tiktoken
from openai import AsyncClient, APIConnectionError, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from server.config.settings import settings
from server.exceptions import OpenAICircuitOpenError, InferenceTimeoutError

logger = logging.getLogger(__name__)

_http_client = httpx.AsyncClient(timeout=float(settings.openai_call_timeout))

openai_client = AsyncClient(
    api_key=settings.openai_api_key,
    http_client=_http_client,
)


class _CircuitState:
    __slots__ = ("_lock", "_consecutive_failures", "_total_calls", "_total_failures",
                 "_total_tokens", "_latencies")

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._consecutive_failures: int = 0
        self._total_calls: int = 0
        self._total_failures: int = 0
        self._total_tokens: int = 0
        self._latencies: list[float] = []

    async def check(self) -> None:
        async with self._lock:
            if self._consecutive_failures >= 5:
                raise OpenAICircuitOpenError()

    async def record_success(self, latency_ms: float, tokens: int) -> None:
        async with self._lock:
            self._consecutive_failures = 0
            self._total_calls += 1
            self._total_tokens += tokens
            self._latencies.append(latency_ms)
            if len(self._latencies) > 500:
                self._latencies = self._latencies[-500:]

    async def record_failure(self) -> None:
        async with self._lock:
            self._consecutive_failures += 1
            self._total_calls += 1
            self._total_failures += 1
            if self._consecutive_failures >= 5:
                logger.critical("openai_circuit_open", extra={"consecutive_failures": 5})

    def metrics(self) -> dict[str, Any]:
        lats = self._latencies or [0.0]
        sorted_lats = sorted(lats)
        n = len(sorted_lats)
        return {
            "circuit_open": self._consecutive_failures >= 5,
            "consecutive_failures": self._consecutive_failures,
            "total_calls": self._total_calls,
            "total_failures": self._total_failures,
            "total_tokens": self._total_tokens,
            "latency_p50_ms": sorted_lats[n // 2],
            "latency_p99_ms": sorted_lats[min(int(n * 0.99), n - 1)],
        }


_state = _CircuitState()


def _count_tokens(text: str, model: str) -> int:
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError)),
    reraise=True,
)
async def _execute_with_retry(model: str, messages: list[dict[str, Any]], **kwargs: Any) -> Any:
    return await openai_client.chat.completions.create(model=model, messages=messages, **kwargs)


async def generate_completion(
    messages: list[dict[str, Any]],
    model: str = settings.openai_model,
    **kwargs: Any,
) -> Any:
    await _state.check()

    prompt_tokens = sum(
        _count_tokens(m["content"], model) for m in messages if isinstance(m.get("content"), str)
    )
    t0 = time.perf_counter()

    try:
        response = await asyncio.wait_for(
            _execute_with_retry(model, messages, **kwargs),
            timeout=settings.openai_call_timeout,
        )
    except asyncio.TimeoutError:
        await _state.record_failure()
        raise InferenceTimeoutError(f"OpenAI call exceeded {settings.openai_call_timeout}s timeout")
    except OpenAICircuitOpenError:
        raise
    except Exception:
        await _state.record_failure()
        raise

    latency_ms = (time.perf_counter() - t0) * 1000
    completion_tokens = 0
    if response and hasattr(response, "usage") and response.usage:
        completion_tokens = getattr(response.usage, "completion_tokens", 0) or 0

    await _state.record_success(latency_ms, prompt_tokens + completion_tokens)

    logger.info(
        "llm_call",
        extra={
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "latency_ms": round(latency_ms, 1),
        },
    )
    return response


def get_llm_metrics() -> dict[str, Any]:
    return _state.metrics()
