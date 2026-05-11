"""
PHQ-9 and GAD-7 scoring services.

Single responsibility: calculate scores and classify severity.
No DB access, no HTTP layer.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AssessmentResult:
    score: int
    severity_level: str
    severity_label: str
    treatment_recommendations: dict[str, Any]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _score_responses(responses: dict[str, int], prefix: str, expected: int) -> int:
    if len(responses) != expected:
        raise ValueError(f"{prefix.upper()} requires exactly {expected} responses, got {len(responses)}")
    total = 0
    for q_id, value in responses.items():
        if not q_id.startswith(prefix):
            raise ValueError(f"Invalid question ID '{q_id}' for {prefix.upper()}")
        if not isinstance(value, int) or value < 0 or value > 3:
            raise ValueError(f"Score for {q_id} must be 0–3, got {value!r}")
        total += value
    return total


def _classify(score: int, guidelines: dict[tuple[int, int], dict[str, str]], max_score: int) -> AssessmentResult:
    if score < 0 or score > max_score:
        raise ValueError(f"Score {score} is outside valid range 0–{max_score}")
    for (lo, hi), meta in guidelines.items():
        if lo <= score <= hi:
            return AssessmentResult(
                score=score,
                severity_level=meta["severity"].lower().replace(" ", "_"),
                severity_label=meta["severity"],
                treatment_recommendations={
                    "severity": meta["severity"],
                    "treatment": meta["treatment"],
                    "score_range": f"{lo}–{hi}",
                },
            )
    raise ValueError(f"Unable to classify score {score}")  # pragma: no cover


# ---------------------------------------------------------------------------
# PHQ-9
# ---------------------------------------------------------------------------

_PHQ9_GUIDELINES: dict[tuple[int, int], dict[str, str]] = {
    (0, 4): {"severity": "None-minimal", "treatment": "None"},
    (5, 9): {"severity": "Mild", "treatment": "Watchful waiting; repeat PHQ-9 at follow-up"},
    (10, 14): {
        "severity": "Moderate",
        "treatment": "Treatment plan, considering counseling, follow-up and/or pharmacotherapy",
    },
    (15, 19): {
        "severity": "Moderately Severe",
        "treatment": "Active treatment with pharmacotherapy and/or psychotherapy",
    },
    (20, 27): {
        "severity": "Severe",
        "treatment": (
            "Immediate initiation of pharmacotherapy and, if severe impairment or poor response to therapy, "
            "expedited referral to a mental health specialist for psychotherapy and/or collaborative management"
        ),
    },
}


class PHQ9ScoringService:
    """Score and classify a PHQ-9 submission. Pure logic — no side effects."""

    @staticmethod
    def calculate_score(responses: dict[str, int]) -> int:
        if not responses:
            raise ValueError("Responses cannot be empty")
        return _score_responses(responses, "phq9_", 9)

    @staticmethod
    def get_severity_and_treatment(score: int) -> AssessmentResult:
        return _classify(score, _PHQ9_GUIDELINES, 27)


# ---------------------------------------------------------------------------
# GAD-7
# ---------------------------------------------------------------------------

_GAD7_GUIDELINES: dict[tuple[int, int], dict[str, str]] = {
    (0, 4): {
        "severity": "None to minimal anxiety",
        "treatment": (
            "No specific intervention is typically needed. Focus on general wellness — "
            "healthy diet, regular exercise, and good sleep hygiene."
        ),
    },
    (5, 9): {
        "severity": "Mild anxiety",
        "treatment": (
            "Monitor symptoms; repeat GAD-7 every 4 weeks. Consider lifestyle adjustments "
            "and stress-management techniques (mindfulness, deep breathing, psychoeducation)."
        ),
    },
    (10, 14): {
        "severity": "Moderate anxiety",
        "treatment": (
            "Further clinical assessment recommended. Consider structured therapies (CBT) "
            "or a combination with medication (SSRIs/SNRIs). Referral to a mental health professional often warranted."
        ),
    },
    (15, 21): {
        "severity": "Severe anxiety",
        "treatment": (
            "Active comprehensive treatment typically necessary — combination of medication and psychotherapy (CBT). "
            "Referral for a full psychiatric evaluation is strongly recommended."
        ),
    },
}


class GAD7ScoringService:
    """Score and classify a GAD-7 submission. Pure logic — no side effects."""

    @staticmethod
    def calculate_score(responses: dict[str, int]) -> int:
        if not responses:
            raise ValueError("Responses cannot be empty")
        return _score_responses(responses, "gad7_", 7)

    @staticmethod
    def get_severity_and_treatment(score: int) -> AssessmentResult:
        return _classify(score, _GAD7_GUIDELINES, 21)
