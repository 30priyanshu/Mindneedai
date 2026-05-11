"""Speech analysis HTTP layer.

Endpoints take audio uploads as in-memory bytes; ownership is enforced by
the service against the authenticated user. ``user_id`` is never read from
the request body.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from loguru import logger
from sqlalchemy.orm import Session

from server.analysis.speech.analyzer import SpeechAnalyzer
from server.analysis.speech.learner import SpeechLearner
from server.analysis.speech.model_manager import SpeechModelManager
from server.analysis.speech.reasoner import SpeechReasoner
from server.db.repositories.audio_repo import AudioAnalysisReviewRepository, AudioSessionRepository
from server.db.repositories.notification_repo import NotificationRepository
from server.db.session import get_db
from server.exceptions import NotFoundError
from server.features.auth.dependencies import get_current_user
from server.features.notifications.service import NotificationService
from server.features.speech_analysis.schemas import (
    AudioAnalysisRequest, AudioAnalysisResult, AudioFeedbackRequest,
    AudioFileAnalysisResponse, AudioSessionRequest, AudioSessionResponse,
)
from server.features.speech_analysis.service import SpeechAnalysisService
from server.infra.runtime.deps import get_speech_analyzer
from server.infra.runtime.rate_limit import rate_limit
from server.security.audit import AuditLogger
from server.utils.timezone import to_utc

router = APIRouter(prefix="/audio-analysis", tags=["audio-analysis"])

_audit_logger = AuditLogger()
_model_manager = SpeechModelManager()
_learner = SpeechLearner()
_reasoner: SpeechReasoner | None = None

_ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm"}
_MAX_FILE_BYTES = 100 * 1024 * 1024


def get_speech_reasoner() -> SpeechReasoner:
    global _reasoner
    if _reasoner is None:
        _reasoner = SpeechReasoner()
    return _reasoner


def get_speech_service(
    db: Session = Depends(get_db),
    analyzer: SpeechAnalyzer = Depends(get_speech_analyzer),
    reasoner: SpeechReasoner = Depends(get_speech_reasoner),
) -> SpeechAnalysisService:
    return SpeechAnalysisService(
        analyzer=analyzer,
        reasoner=reasoner,
        audio_repo=AudioSessionRepository(db),
        review_repo=AudioAnalysisReviewRepository(db),
        notification_svc=NotificationService(repo=NotificationRepository(db)),
        audit_logger=_audit_logger,
    )


def _validate_upload(filename: str, size: int) -> None:
    ext = Path(filename or "").suffix.lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Allowed: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )
    if size > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 100MB)")


@router.post("/start-session", response_model=AudioSessionResponse)
def start_session(
    request: AudioSessionRequest,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    return service.start_session(
        current_user["user_id"], request.audio_source or "web", bg_tasks,
    )


@router.post(
    "/analyze-file",
    response_model=AudioFileAnalysisResponse,
    dependencies=[Depends(rate_limit("audio"))],
)
async def analyze_file(
    audio_file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    file_bytes = await audio_file.read()
    _validate_upload(audio_file.filename or "", len(file_bytes))

    user_id = current_user["user_id"]
    if not session_id:
        session_resp = service.start_session(user_id, "upload", bg_tasks)
        session_id = session_resp.session_id

    return await service.analyze_file(
        session_id, user_id, file_bytes, audio_file.filename or "upload.wav", bg_tasks,
    )


@router.post(
    "/analyze-stream",
    response_model=AudioFileAnalysisResponse,
    dependencies=[Depends(rate_limit("audio"))],
)
async def analyze_stream(
    audio_chunks: List[UploadFile] = File(...),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    chunks_data: list[bytes] = []
    total_size = 0
    for chunk in audio_chunks:
        data = await chunk.read()
        chunks_data.append(data)
        total_size += len(data)
        if total_size > _MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="Total stream size too large (max 100MB)")
    return await service.analyze_stream(current_user["user_id"], chunks_data, bg_tasks)


@router.post(
    "/analyze",
    response_model=AudioFileAnalysisResponse,
    dependencies=[Depends(rate_limit("audio"))],
)
async def analyze_audio_convenience(
    audio: UploadFile = File(...),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    file_bytes = await audio.read()
    _validate_upload(audio.filename or "audio.wav", len(file_bytes))
    user_id = current_user["user_id"]
    session_resp = service.start_session(user_id, "api", bg_tasks)
    return await service.analyze_file(
        session_resp.session_id, user_id, file_bytes, audio.filename or "upload.wav", bg_tasks,
    )


@router.get("/session/{session_id}", response_model=AudioSessionResponse)
def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    try:
        return service.get_session(session_id, current_user["user_id"])
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/end-session", response_model=AudioSessionResponse)
def end_session(
    session_id: str,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    try:
        return service.end_session(session_id, current_user["user_id"], bg_tasks)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/sessions")
def list_sessions(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    return service.list_sessions(
        current_user["user_id"], status, min(limit, 100), max(offset, 0),
    )


@router.post("/feedback")
async def submit_feedback(
    request: AudioFeedbackRequest,
    current_user: dict = Depends(get_current_user),
    service: SpeechAnalysisService = Depends(get_speech_service),
):
    try:
        service.save_feedback(request.session_id, current_user["user_id"], {
            "human_correction": request.human_assessment,
            "confidence": request.confidence_score,
        })
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    _learner.collect_feedback(request.session_id, {
        "reviewer_id": request.reviewer_id,
        "human_assessment": request.human_assessment,
        "confidence_score": request.confidence_score,
        "review_notes": request.review_notes,
        "audio_quality_rating": request.audio_quality_rating,
    })
    return {"status": "success", "session_id": request.session_id}


@router.get("/performance")
async def get_performance(
    current_user: dict = Depends(get_current_user),
    analyzer: SpeechAnalyzer = Depends(get_speech_analyzer),
):
    return {
        "service_performance": {
            "model_type": "Wav2Vec2",
            "model_name": analyzer.model_name,
            "device": analyzer.device,
            "model_loaded": analyzer.is_loaded,
        },
        "model_registry": {
            "active_version": _model_manager.get_active_version(),
            "total_versions": len(_model_manager.versions),
        },
        "learning_metrics": {"pending_feedback": len(_learner._feedback_buffer)},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/training/weekly")
async def trigger_weekly_training(
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    training_id = f"weekly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    bg_tasks.add_task(_learner.trigger_cycle)
    return {
        "status": "started", "training_id": training_id,
        "message": "Weekly training initiated in background",
        "estimated_duration": "15-30 minutes",
    }


@router.get("/models")
async def list_models(current_user: dict = Depends(get_current_user)):
    active = _model_manager.get_active_version()
    versions = [
        {
            "version_id": vid, "is_active": v.get("is_active", False),
            "fine_tuned": v.get("fine_tuned", False), "created_at": v.get("created_at"),
        }
        for vid, v in _model_manager.versions.items()
    ]
    return {"active_version": active, "total_models": len(versions), "models": versions}


@router.post("/models/{version_id}/activate")
async def activate_model(version_id: str, current_user: dict = Depends(get_current_user)):
    try:
        _model_manager.activate_version(version_id)
        return {"status": "success", "active_model": version_id}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/health")
async def health_check(analyzer: SpeechAnalyzer = Depends(get_speech_analyzer)):
    return {
        "status": "healthy", "model_loaded": analyzer.is_loaded,
        "service": "audio-analysis", "version": "2.0.0",
    }


@router.get("/supported-formats")
async def get_supported_formats():
    return {
        "supported_formats": [
            {"extension": ".wav", "description": "Waveform Audio File Format", "recommended": True},
            {"extension": ".mp3", "description": "MPEG Audio Layer III", "recommended": True},
            {"extension": ".webm", "description": "WebM Audio (Browser Recording)", "recommended": True},
            {"extension": ".m4a", "description": "MPEG-4 Audio", "recommended": True},
            {"extension": ".flac", "description": "Free Lossless Audio Codec", "recommended": False},
            {"extension": ".ogg", "description": "Ogg Vorbis", "recommended": False},
        ],
        "requirements": {
            "max_file_size_mb": 100, "min_duration_seconds": 1.0,
            "max_duration_seconds": 1200.0, "recommended_sample_rate": 16000,
            "supported_sample_rates": [8000, 16000, 22050, 44100, 48000],
        },
    }


@router.delete("/cleanup")
async def cleanup_old_data(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    repo = AudioSessionRepository(db)
    sessions = repo.list_by_user(current_user["user_id"], page=1, size=1000)
    deleted = 0
    for s in sessions:
        if s.created_at and to_utc(s.created_at) < cutoff:
            db.delete(s)
            deleted += 1
    db.commit()
    return {"status": "success", "deleted_sessions": deleted, "cleanup_cutoff_days": days}
