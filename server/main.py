"""Application factory: lifespan, middleware, error handlers, routers, media.

All ML analyzers are loaded asynchronously inside the lifespan and attached
to ``app.state.analyzers`` so request handlers consume a deterministic
registry instead of mutable module-level globals. ``/api/v1/health`` reports
liveness only (DB ping); ``/api/v1/ready`` reports model readiness so the
load balancer can keep traffic away from cold replicas.
"""
from __future__ import annotations

import asyncio
import os
import sys

os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

import sentry_sdk
from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from sentry_sdk.utils import BadDsn
from sqlalchemy import text

from server.analysis.facial.analyzer import FacialAnalyzer
from server.analysis.speech.analyzer import SpeechAnalyzer
from server.analysis.text.analyzer import TextAnalyzer
from server.config.settings import settings
from server.db.session import engine
from server.error_handlers import register_error_handlers
from server.exceptions import DatabaseError
from server.features.auth.router import auth_router
from server.features.assessments.router import assessments_router
from server.features.dashboard.router import dashboard_router
from server.features.doctor_profile.router import doctor_profile_router
from server.features.emergency.router import emergency_router
from server.features.facial_analysis.router import router as facial_analysis_router
from server.features.health_metrics.router import health_metrics_router
from server.features.history.router import history_router
from server.features.human_review.router import human_review_router
from server.features.mood.router import mood_router
from server.features.notifications.router import notifications_router
from server.features.observability.router import router as observability_router
from server.features.preferences.router import preferences_router
from server.features.recommendations.local_video.router import local_video_router
from server.features.recommendations.music.router import music_router
from server.features.recommendations.youtube.router import youtube_router
from server.features.speech_analysis.router import router as speech_analysis_router
from server.features.text_analysis.router import router as text_analysis_router
from server.features.user_profile.router import user_profile_router
from server.features.wellness_forms.router import wellness_forms_router
from server.infra.media.static_handler import AudioStaticFiles
from server.infra.runtime.gpu_janitor import gpu_cache_cleaner
from server.infra.runtime.rate_limit import configure_rate_limit
from server.infra.runtime.registry import AnalyzerRegistry
from server.middleware.request_id import RequestIDMiddleware
from server.middleware.response_size_limit import ResponseSizeLimitMiddleware


def _configure_logging() -> None:
    logger.remove()
    if settings.environment == "production":
        logger.add(sys.stdout, format="{message}", serialize=True, level=settings.log_level)
    else:
        logger.add(sys.stderr, colorize=True, level=settings.log_level)


def _before_send_sentry(event: dict, hint: dict) -> dict | None:
    exc_info = hint.get("exc_info")
    if exc_info:
        exc_value = exc_info[1]
        code = getattr(exc_value, "code", None) or getattr(exc_value, "status_code", None)
        if code in (404, 422):
            return None
    return event


def _init_sentry() -> None:
    if not settings.sentry_dsn:
        return
    try:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            traces_sample_rate=0.1,
            send_default_pii=False,
            before_send=_before_send_sentry,
        )
    except BadDsn:
        logger.warning("sentry_invalid_dsn")


def _configure_rate_limits() -> None:
    configure_rate_limit("text", capacity=settings.rate_limit_analyze_text_per_minute, refill_per_s=settings.rate_limit_analyze_text_per_minute / 60)
    configure_rate_limit("audio", capacity=settings.rate_limit_analyze_audio_per_minute, refill_per_s=settings.rate_limit_analyze_audio_per_minute / 60)
    configure_rate_limit("frame", capacity=settings.rate_limit_analyze_frame_per_second * 2, refill_per_s=settings.rate_limit_analyze_frame_per_second)


async def _load_analyzers(registry: AnalyzerRegistry) -> None:
    """Load each ML analyzer off the event loop; tolerate individual failures."""
    cache_dir = Path(getattr(settings, "model_cache_dir", "model_cache"))

    async def _load(label: str, factory):
        try:
            instance = factory()
            await asyncio.to_thread(instance.load_model)
            logger.info("analyzer_loaded", extra={"analyzer": label})
            return instance
        except Exception as exc:
            logger.error("analyzer_load_failed", extra={"analyzer": label, "error": str(exc)})
            return None

    async def _load_and_assign(label: str, factory, attr_name: str):
        instance = await _load(label, factory)
        if instance:
            setattr(registry, attr_name, instance)
        if registry.text and registry.speech and registry.facial:
            registry.mark_ready()

    await asyncio.gather(
        _load_and_assign("text", lambda: TextAnalyzer(cache_dir=str(cache_dir / "text_analysis")), "text"),
        _load_and_assign("speech", lambda: SpeechAnalyzer(cache_dir=str(cache_dir / "speech_analysis")), "speech"),
        _load_and_assign("facial", lambda: FacialAnalyzer(model_dir=str(cache_dir / "facial_analysis")), "facial"),
    )


async def _unload_analyzers(registry: AnalyzerRegistry) -> None:
    for label, analyzer in [("text", registry.text), ("speech", registry.speech), ("facial", registry.facial)]:
        if analyzer is None:
            continue
        try:
            await asyncio.to_thread(analyzer.unload)
        except Exception as exc:
            logger.error("analyzer_unload_failed", extra={"analyzer": label, "error": str(exc)})


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    _configure_logging()
    _init_sentry()
    _configure_rate_limits()
    registry = AnalyzerRegistry()
    app.state.analyzers = registry
    logger.info("startup", extra={"environment": settings.environment})

    asyncio.create_task(_load_analyzers(registry), name="analyzer_warmup")
    janitor_task = asyncio.create_task(
        gpu_cache_cleaner(settings.gpu_cache_clear_interval_s),
        name="gpu_janitor",
    )

    try:
        yield
    finally:
        janitor_task.cancel()
        try:
            await janitor_task
        except (asyncio.CancelledError, Exception):
            pass
        await _unload_analyzers(registry)
        logger.info("shutdown")


_health_router = APIRouter(tags=["health"])


@_health_router.get("/")
async def root_info() -> dict[str, str]:
    return {"name": "MindNeedAI API", "status": "ok", "version": "1.0.0"}


@_health_router.get("/health")
async def health_check() -> dict[str, str]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("health_check_failed", extra={"error": str(exc)})
        raise DatabaseError("Database unreachable", code=503)
    return {"status": "ok"}


@_health_router.get("/ready")
async def readiness_check(request: Request) -> JSONResponse:
    registry: AnalyzerRegistry = request.app.state.analyzers
    body = {
        "ready": registry.ready,
        "models": {
            "text": bool(registry.text and registry.text.is_loaded),
            "speech": bool(registry.speech and registry.speech.is_loaded),
            "facial": bool(registry.facial and registry.facial.is_loaded),
        },
    }
    return JSONResponse(status_code=200 if registry.ready else 503, content=body)


def _mount_media(app: FastAPI) -> None:
    media_root = Path(settings.media_root)
    if not media_root.is_absolute():
        media_root = Path(__file__).parent.parent / media_root
    for subdir, mount_path, name in [
        ("music", "/Data/music", "music"),
        ("videos", "/Data/videos", "videos"),
    ]:
        target = media_root / subdir
        target.mkdir(parents=True, exist_ok=True)
        app.mount(mount_path, AudioStaticFiles(directory=str(target)), name=name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="MindNeedAI API",
        description="Ethically-driven AI mental wellness companion for seniors",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    origins = settings.allowed_origins if settings.environment == "production" else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        max_age=3600,
    )
    app.add_middleware(ResponseSizeLimitMiddleware)
    app.add_middleware(RequestIDMiddleware)

    register_error_handlers(app)

    for r in (
        _health_router, auth_router, text_analysis_router, speech_analysis_router,
        facial_analysis_router, music_router, local_video_router, youtube_router,
        mood_router, health_metrics_router, assessments_router, wellness_forms_router,
        user_profile_router, doctor_profile_router, preferences_router, history_router,
        dashboard_router, notifications_router, emergency_router, human_review_router,
    ):
        app.include_router(r, prefix="/api/v1")
    app.include_router(observability_router)

    _mount_media(app)
    return app


app = create_app()
