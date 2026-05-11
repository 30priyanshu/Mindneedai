/**
 * Single responsibility: validate vitals and derive per-metric risk for UI.
 */
import type { RiskLevel } from '@/core/types';
import {
  HEALTH_O2_CRITICAL,
  HEALTH_O2_LOW,
  HEALTH_PULSE_MAX,
  HEALTH_PULSE_MIN,
} from '@/core/constants';

export type { RiskLevel };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: RiskLevel;
}

const BP_DANGER_SYS = 180;
const BP_DANGER_DIA = 120;

const raiseRisk = (current: RiskLevel, next: RiskLevel): RiskLevel => {
  if (current === 'danger' || next === 'danger') return 'danger';
  if (current === 'caution' || next === 'caution') return 'caution';
  return 'normal';
};

export const validateHealthMetrics = (
  o2?: number | null,
  systolic?: number | null,
  diastolic?: number | null,
  pulse?: number | null,
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let risk: RiskLevel = 'normal';

  if (o2 == null && systolic == null && diastolic == null && pulse == null) {
    return {
      isValid: false,
      errors: ['At least one metric is required'],
      warnings,
      riskLevel: 'normal',
    };
  }

  if (o2 != null) {
    if (o2 < 50 || o2 > 100) errors.push('Oxygen level must be between 50 and 100');
    else if (o2 < HEALTH_O2_CRITICAL) {
      risk = 'danger';
      warnings.push('Oxygen level is critically low');
    } else if (o2 < HEALTH_O2_LOW) {
      risk = raiseRisk(risk, 'caution');
      warnings.push('Oxygen level is below normal');
    }
  }

  if (systolic != null) {
    if (systolic < 50 || systolic > 260) errors.push('Systolic BP must be between 50 and 260');
    else if (systolic >= BP_DANGER_SYS) {
      risk = 'danger';
      warnings.push('Systolic BP is dangerously high');
    } else if (systolic >= 140) {
      risk = raiseRisk(risk, 'caution');
      warnings.push('Systolic BP is above normal');
    }
  }

  if (diastolic != null) {
    if (diastolic < 30 || diastolic > 200) errors.push('Diastolic BP must be between 30 and 200');
    else if (diastolic >= BP_DANGER_DIA) {
      risk = 'danger';
      warnings.push('Diastolic BP is dangerously high');
    } else if (diastolic >= 90) {
      risk = raiseRisk(risk, 'caution');
      warnings.push('Diastolic BP is above normal');
    }
  }

  if (pulse != null) {
    if (pulse < 20 || pulse > 250) errors.push('Pulse must be between 20 and 250');
    else if (pulse < HEALTH_PULSE_MIN || pulse > HEALTH_PULSE_MAX) {
      risk = 'danger';
      warnings.push('Pulse is in a dangerous range');
    } else if (pulse < 55 || pulse > 100) {
      risk = raiseRisk(risk, 'caution');
      warnings.push('Pulse is outside normal resting range');
    }
  }

  return { isValid: errors.length === 0, errors, warnings, riskLevel: risk };
};

export const getMetricStatus = (metric: string, value?: number | null): RiskLevel => {
  if (value == null) return 'normal';
  if (metric === 'oxygen_level') {
    if (value < HEALTH_O2_CRITICAL) return 'danger';
    if (value < HEALTH_O2_LOW) return 'caution';
    return 'normal';
  }
  if (metric === 'systolic_bp') {
    if (value >= BP_DANGER_SYS) return 'danger';
    if (value >= 140) return 'caution';
    return 'normal';
  }
  if (metric === 'diastolic_bp') {
    if (value >= BP_DANGER_DIA) return 'danger';
    if (value >= 90) return 'caution';
    return 'normal';
  }
  if (metric === 'pulse_rate') {
    if (value < HEALTH_PULSE_MIN || value > HEALTH_PULSE_MAX) return 'danger';
    if (value < 55 || value > 100) return 'caution';
    return 'normal';
  }
  return 'normal';
};
