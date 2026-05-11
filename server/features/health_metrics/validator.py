"""
Health Metrics validator.

Single responsibility: range checks for O2, BP, pulse and risk-level derivation.
No service logic, no DB access, no HTTP layer.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class HealthMetricsValidation:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    risk_level: str  # "normal" | "caution" | "danger"


def _escalate(current: str, proposed: str) -> str:
    """Return the higher severity level between current and proposed."""
    if "danger" in (current, proposed):
        return "danger"
    if "caution" in (current, proposed):
        return "caution"
    return "normal"


class HealthMetricsValidator:
    """Stateless validator for vital sign metrics."""

    O2_CRITICAL = 90
    O2_LOW = 94
    BP_DANGER_SYS = 180
    BP_CAUTION_SYS = 140
    BP_DANGER_DIA = 120
    BP_CAUTION_DIA = 90
    PULSE_LOW = 40
    PULSE_HIGH = 120
    PULSE_CAUTION_LOW = 55
    PULSE_CAUTION_HIGH = 100

    @classmethod
    def validate_entry(
        cls,
        *,
        o2: Optional[float] = None,
        systolic: Optional[int] = None,
        diastolic: Optional[int] = None,
        pulse: Optional[int] = None,
    ) -> HealthMetricsValidation:
        if all(v is None for v in (o2, systolic, diastolic, pulse)):
            return HealthMetricsValidation(False, ["At least one metric is required"], [], "normal")

        errors: list[str] = []
        warnings: list[str] = []
        risk = "normal"

        if o2 is not None:
            if o2 < 50 or o2 > 100:
                errors.append("Oxygen level must be between 50 and 100")
            elif o2 < cls.O2_CRITICAL:
                risk = "danger"
                warnings.append("Oxygen level is critically low")
            elif o2 < cls.O2_LOW:
                risk = _escalate(risk, "caution")
                warnings.append("Oxygen level is below normal")

        if systolic is not None:
            if systolic < 50 or systolic > 260:
                errors.append("Systolic BP must be between 50 and 260")
            elif systolic >= cls.BP_DANGER_SYS:
                risk = "danger"
                warnings.append("Systolic BP is dangerously high")
            elif systolic >= cls.BP_CAUTION_SYS:
                risk = _escalate(risk, "caution")
                warnings.append("Systolic BP is above normal")

        if diastolic is not None:
            if diastolic < 30 or diastolic > 200:
                errors.append("Diastolic BP must be between 30 and 200")
            elif diastolic >= cls.BP_DANGER_DIA:
                risk = "danger"
                warnings.append("Diastolic BP is dangerously high")
            elif diastolic >= cls.BP_CAUTION_DIA:
                risk = _escalate(risk, "caution")
                warnings.append("Diastolic BP is above normal")

        if pulse is not None:
            if pulse < 20 or pulse > 250:
                errors.append("Pulse must be between 20 and 250")
            elif pulse < cls.PULSE_LOW or pulse > cls.PULSE_HIGH:
                risk = "danger"
                warnings.append("Pulse is in a dangerous range")
            elif pulse < cls.PULSE_CAUTION_LOW or pulse > cls.PULSE_CAUTION_HIGH:
                risk = _escalate(risk, "caution")
                warnings.append("Pulse is outside normal resting range")

        return HealthMetricsValidation(not errors, errors, warnings, risk)
