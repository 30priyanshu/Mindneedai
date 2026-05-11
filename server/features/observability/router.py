"""LLM/inference metrics endpoint."""
from fastapi import APIRouter, Depends, Request

from server.analysis.shared.inference_runner import metrics as runner_metrics
from server.features.auth.dependencies import get_current_user
from server.infra.openai.client import get_llm_metrics
from server.infra.runtime.deps import get_registry
from server.infra.runtime.registry import AnalyzerRegistry

router = APIRouter(prefix="/api/v1/llm", tags=["observability"])


@router.get("/metrics")
async def llm_metrics(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> dict:
    registry: AnalyzerRegistry = get_registry(request)
    health = {}
    if registry.text:
        health["text"] = registry.text.health_check()
    if registry.speech:
        health["speech"] = registry.speech.health_check()
    if registry.facial:
        health["facial"] = registry.facial.health_check()
    return {
        "openai": get_llm_metrics(),
        "models": health,
        "inference": runner_metrics(),
        "video_sessions": registry.video_session_count(),
        "ready": registry.ready,
    }
