"""
Wellness Forms AI Generator.

Single responsibility: generate clinical and patient summaries via OpenAI.
OpenAI client is injected — never imported directly.
Pattern detection is pure Python, no I/O.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from loguru import logger


@dataclass
class PatternAnalysis:
    mood_trend: str
    severity_change: Optional[str]
    correlations: list[str]
    risk_indicators: list[str]
    protective_factors: list[str]
    progression: str
    severity_score: Optional[float] = None


@dataclass
class AIInsightsResult:
    clinical_summary: str
    patient_summary: str
    patterns: PatternAnalysis
    model_version: str
    generated_at: datetime


_NEGATIVE_MOODS = frozenset({"depressed", "sad", "hopeless", "anxious", "angry"})
_CLINICAL_SYSTEM = (
    "You are a clinical psychologist analyzing a mental status examination form. "
    "Generate a professional clinical narrative that: "
    "1. Identifies primary presenting concerns with severity assessment. "
    "2. Highlights symptom correlations and patterns. "
    "3. Notes risk factors and protective factors. "
    "4. Compares to previous assessments when available. "
    "5. Provides recommended focus areas for treatment. "
    "Be concise (300-500 words) and objective. "
    "IMPORTANT: Return ONLY plain text. Do NOT use markdown, code blocks, "
    "or any special formatting."
)
_PATIENT_SYSTEM = (
    "You are a compassionate mental health companion. Generate a warm, supportive summary that: "
    "1. Uses simple, non-clinical language. "
    "2. Validates feelings (e.g., 'It sounds like you've been experiencing...'). "
    "3. Highlights strengths and positive patterns. "
    "4. Shows progression from past assessments when available. "
    "5. Encourages without medical jargon. (200-300 words). "
    "IMPORTANT: Return ONLY plain text. Do NOT use markdown, code blocks, "
    "or any special formatting."
)


def _hash_form(form_data: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(form_data, sort_keys=True, default=str).encode()).hexdigest()


def _clean(text: str) -> str:
    text = re.sub(r"^```[\w]*\n?", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\n?```$", "", text, flags=re.MULTILINE)
    return text.strip()


def _format_form(form_data: dict[str, Any]) -> str:
    """Flatten MSE sections into a structured text block for the prompt."""
    parts: list[str] = []

    def _render(label: str, data: dict[str, Any], keys: list[str]) -> None:
        items = [f"{k}: {', '.join(data[k]) if isinstance(data[k], list) else data[k]}"
                 for k in keys if data.get(k)]
        if items:
            parts.append(f"{label}: {'; '.join(items)}")

    obs = form_data.get("observations", {})
    _render("Observations", obs, ["appearance", "speech", "eyeContact", "motorActivity", "affect", "comments"])
    _render("Mood", form_data.get("mood", {}), ["options", "comments"])
    _render("Cognition", form_data.get("cognition", {}), ["orientationImpairment", "memoryImpairment", "attention", "comments"])
    _render("Perception", form_data.get("perception", {}), ["hallucinations", "other", "comments"])
    _render("Thoughts", form_data.get("thoughts", {}), ["suicidality", "homicidality", "delusions", "comments"])
    _render("Behavior", form_data.get("behavior", {}), ["options", "comments"])
    _render("Insight", form_data.get("insight", {}), ["option", "comments"])
    _render("Judgment", form_data.get("judgment", {}), ["option", "comments"])
    return "\n".join(parts)


def _history_context(previous: list[dict[str, Any]]) -> str:
    if not previous:
        return "This is the first assessment. No historical comparison available."
    lines = [f"Previous assessments: {len(previous)}"]
    for i, p in enumerate(previous[:3], 1):
        date_str = p.get("form_date", "unknown date")
        moods = p.get("form_data", {}).get("mood", {}).get("options", [])
        if moods:
            lines.append(f"Assessment {i} ({date_str}): Mood: {', '.join(moods[:3])}")
    return "\n".join(lines)


def _severity_score(form_data: dict[str, Any]) -> float:
    score = 0.0
    thoughts = form_data.get("thoughts", {})
    if thoughts.get("suicidality"):
        score += 4.0
    if thoughts.get("homicidality"):
        score += 4.0
    if thoughts.get("delusions"):
        score += 2.0
    mood_opts = str(form_data.get("mood", {}).get("options", [])).lower()
    if any(m in mood_opts for m in _NEGATIVE_MOODS):
        score += 2.0
    behavior = str(form_data.get("behavior", {}).get("options", [])).lower()
    if "withdrawn" in behavior:
        score += 1.0
    if "aggressive" in behavior:
        score += 1.5
    if "poor" in str(form_data.get("cognition", {}).get("attention", [])).lower():
        score += 1.0
    return min(score / 10.0, 1.0)


class WellnessFormAIGenerator:
    """Generates clinical and patient AI summaries for wellness forms."""

    def __init__(self, openai_client: Any, model: str) -> None:
        self._client = openai_client
        self._model = model

    def form_data_hash(self, form_data: dict[str, Any]) -> str:
        return _hash_form(form_data)

    async def generate_clinical_summary(
        self, form_data: dict[str, Any], previous_forms: list[dict[str, Any]]
    ) -> Optional[str]:
        formatted = _format_form(form_data)
        history = _history_context(previous_forms)
        messages = [
            {"role": "system", "content": _CLINICAL_SYSTEM},
            {"role": "user", "content": f"MSE Data:\n{formatted}\n\nHistory:\n{history}"},
        ]
        return await self._call(messages, temperature=0.3, max_tokens=800)

    async def generate_patient_summary(
        self, form_data: dict[str, Any], previous_forms: list[dict[str, Any]]
    ) -> Optional[str]:
        formatted = _format_form(form_data)
        history = _history_context(previous_forms)
        messages = [
            {"role": "system", "content": _PATIENT_SYSTEM},
            {"role": "user", "content": f"Wellness Data:\n{formatted}\n\nHistory:\n{history}"},
        ]
        return await self._call(messages, temperature=0.7, max_tokens=500)

    def detect_patterns(
        self, form_data: dict[str, Any], previous_forms: list[dict[str, Any]]
    ) -> PatternAnalysis:
        score = _severity_score(form_data)
        if not previous_forms:
            return PatternAnalysis(
                mood_trend="baseline", severity_change=None, correlations=[],
                risk_indicators=self._risk_indicators(form_data),
                protective_factors=self._protective_factors(form_data, []),
                progression="First assessment — future forms will show progress tracking.",
                severity_score=score,
            )

        prev_scores = [_severity_score(p.get("form_data", {})) for p in previous_forms[:5]]
        mood_trend = self._mood_trend(form_data, previous_forms, score, prev_scores)
        severity_change = self._severity_change(score, prev_scores)

        progression = f"Compared to {len(previous_forms)} previous assessment(s)"
        progression += (
            ", mood symptoms show improvement." if mood_trend == "improving"
            else ", mood symptoms have intensified." if mood_trend == "declining"
            else ", symptoms remain relatively stable."
        )
        if severity_change:
            progression += f" {severity_change}."

        return PatternAnalysis(
            mood_trend=mood_trend,
            severity_change=severity_change,
            correlations=self._correlations(form_data),
            risk_indicators=self._risk_indicators(form_data),
            protective_factors=self._protective_factors(form_data, prev_scores),
            progression=progression,
            severity_score=score,
        )

    async def generate_insights(
        self, form_data: dict[str, Any], previous_forms: list[dict[str, Any]]
    ) -> Optional[AIInsightsResult]:
        try:
            clinical, patient = (
                await self.generate_clinical_summary(form_data, previous_forms),
                await self.generate_patient_summary(form_data, previous_forms),
            )
            if not clinical or not patient:
                return None
            return AIInsightsResult(
                clinical_summary=clinical,
                patient_summary=patient,
                patterns=self.detect_patterns(form_data, previous_forms),
                model_version=self._model,
                generated_at=datetime.utcnow(),
            )
        except Exception as exc:
            logger.error("wellness_ai_insights_failed", extra={"error": str(exc)})
            return None

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _call(
        self, messages: list[dict], temperature: float, max_tokens: int
    ) -> Optional[str]:
        try:
            response = await self._client.generate_completion(
                messages, model=self._model, temperature=temperature, max_tokens=max_tokens
            )
            raw = response.choices[0].message.content
            return _clean(raw) if raw else None
        except Exception as exc:
            logger.error("wellness_ai_call_failed", extra={"error": str(exc)})
            return None

    @staticmethod
    def _mood_trend(
        form_data: dict, previous_forms: list, score: float, prev_scores: list[float]
    ) -> str:
        current_mood = [m.lower() for m in form_data.get("mood", {}).get("options", [])]
        prev_moods = [
            [m.lower() for m in p.get("form_data", {}).get("mood", {}).get("options", [])]
            for p in previous_forms[:2]
        ]
        current_neg = any(m in _NEGATIVE_MOODS for m in current_mood)
        prev_neg = any(m in _NEGATIVE_MOODS for ms in prev_moods for m in ms)

        if current_neg and not prev_neg:
            return "declining"
        if not current_neg and prev_neg:
            return "improving"
        if current_neg and prev_neg and prev_scores:
            return "declining" if score > prev_scores[0] else "improving" if score < prev_scores[0] else "stable"
        return "stable"

    @staticmethod
    def _severity_change(score: float, prev_scores: list[float]) -> Optional[str]:
        if not prev_scores:
            return None
        delta = score - prev_scores[0]
        if delta < -0.2:
            return "Significant risk reduction observed"
        if delta > 0.2:
            return "Significant risk increase observed"
        if delta < 0:
            return "Risk reduction observed"
        if delta > 0:
            return "Risk increase observed"
        return None

    @staticmethod
    def _correlations(form_data: dict) -> list[str]:
        result: list[str] = []
        mood = [str(m).lower() for m in form_data.get("mood", {}).get("options", [])]
        behavior = str(form_data.get("behavior", {}).get("options", [])).lower()
        attention = str(form_data.get("cognition", {}).get("attention", [])).lower()
        thoughts = form_data.get("thoughts", {})
        if "withdrawn" in behavior and any(m in {"depressed", "sad", "hopeless"} for m in mood):
            result.append("Social withdrawal ↔ Worsening mood")
        if "poor" in attention and any(m in {"depressed", "anxious"} for m in mood):
            result.append("Attention difficulties ↔ Mood symptoms")
        if thoughts.get("suicidality") and any(m in {"depressed", "hopeless"} for m in mood):
            result.append("Suicidal ideation ↔ Severe mood symptoms")
        return result

    @staticmethod
    def _risk_indicators(form_data: dict) -> list[str]:
        result: list[str] = []
        thoughts = form_data.get("thoughts", {})
        if thoughts.get("suicidality"):
            result.append("Suicidal ideation present")
        if thoughts.get("homicidality"):
            result.append("Homicidal ideation present")
        if _severity_score(form_data) >= 0.7:
            result.append("High overall severity score")
        return result

    @staticmethod
    def _protective_factors(form_data: dict, prev_scores: list[float]) -> list[str]:
        result: list[str] = []
        insight = form_data.get("insight", {}).get("option", "").lower()
        judgment = form_data.get("judgment", {}).get("option", "").lower()
        if insight in ("good", "fair"):
            result.append("Good insight into condition")
        if judgment in ("good", "fair"):
            result.append("Adequate judgment")
        thoughts = form_data.get("thoughts", {})
        if not thoughts.get("suicidality") and not thoughts.get("homicidality"):
            result.append("No immediate risk indicators detected")
        return result
