"""FastAPI dependencies that fetch analyzers from ``app.state.analyzers``."""
from __future__ import annotations

from fastapi import Request

from server.analysis.facial.analyzer import FacialAnalyzer
from server.analysis.speech.analyzer import SpeechAnalyzer
from server.analysis.text.analyzer import TextAnalyzer
from server.exceptions import ModelNotLoadedError
from server.infra.runtime.registry import AnalyzerRegistry


def get_registry(request: Request) -> AnalyzerRegistry:
    registry: AnalyzerRegistry | None = getattr(request.app.state, "analyzers", None)
    if registry is None:
        raise ModelNotLoadedError("Analyzer registry not initialised")
    return registry


def get_text_analyzer(request: Request) -> TextAnalyzer:
    registry = get_registry(request)
    if registry.text is None or not registry.text.is_loaded:
        raise ModelNotLoadedError("Text analyzer is not ready")
    return registry.text


def get_speech_analyzer(request: Request) -> SpeechAnalyzer:
    registry = get_registry(request)
    if registry.speech is None or not registry.speech.is_loaded:
        raise ModelNotLoadedError("Speech analyzer is not ready")
    return registry.speech


def get_facial_analyzer(request: Request) -> FacialAnalyzer:
    registry = get_registry(request)
    if registry.facial is None or not registry.facial.is_loaded:
        raise ModelNotLoadedError("Facial analyzer is not ready")
    return registry.facial
