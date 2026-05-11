"""
PHQ-9 and GAD-7 question definitions.

Single responsibility: static question/option data only.
No service logic, no DB access.
"""
from __future__ import annotations

from typing import Any

_LIKERT_OPTIONS: list[dict[str, Any]] = [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"},
]

PHQ9_QUESTIONS: list[dict[str, Any]] = [
    {"id": "phq9_1", "text": "Little interest or pleasure in doing things", "options": _LIKERT_OPTIONS},
    {"id": "phq9_2", "text": "Feeling down, depressed, or hopeless", "options": _LIKERT_OPTIONS},
    {"id": "phq9_3", "text": "Trouble falling or staying asleep, or sleeping too much", "options": _LIKERT_OPTIONS},
    {"id": "phq9_4", "text": "Feeling tired or having little energy", "options": _LIKERT_OPTIONS},
    {"id": "phq9_5", "text": "Poor appetite or overeating", "options": _LIKERT_OPTIONS},
    {
        "id": "phq9_6",
        "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
        "options": _LIKERT_OPTIONS,
    },
    {
        "id": "phq9_7",
        "text": "Trouble concentrating on things, such as reading the newspaper or watching television",
        "options": _LIKERT_OPTIONS,
    },
    {
        "id": "phq9_8",
        "text": (
            "Moving or speaking so slowly that other people could have noticed. "
            "Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual"
        ),
        "options": _LIKERT_OPTIONS,
    },
    {"id": "phq9_9", "text": "Thoughts that you would be better off dead, or of hurting yourself", "options": _LIKERT_OPTIONS},
]

GAD7_QUESTIONS: list[dict[str, Any]] = [
    {"id": "gad7_1", "text": "Feeling nervous, anxious, or on edge", "options": _LIKERT_OPTIONS},
    {"id": "gad7_2", "text": "Not being able to stop or control worrying", "options": _LIKERT_OPTIONS},
    {"id": "gad7_3", "text": "Worrying too much about different things", "options": _LIKERT_OPTIONS},
    {"id": "gad7_4", "text": "Trouble relaxing", "options": _LIKERT_OPTIONS},
    {"id": "gad7_5", "text": "Being so restless that it is hard to sit still", "options": _LIKERT_OPTIONS},
    {"id": "gad7_6", "text": "Becoming easily annoyed or irritable", "options": _LIKERT_OPTIONS},
    {"id": "gad7_7", "text": "Feeling afraid, as if something awful might happen", "options": _LIKERT_OPTIONS},
]


def get_phq9_questions() -> list[dict[str, Any]]:
    return PHQ9_QUESTIONS


def get_gad7_questions() -> list[dict[str, Any]]:
    return GAD7_QUESTIONS
