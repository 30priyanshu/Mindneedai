import type { RiskLevel } from '@/core/types';

export interface HealthMetricsPayload {
  oxygen_level?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pulse_rate?: number | null;
  note?: string | null;
}

export interface HealthMetricsAIAnalysis {
  analysis?: string;
  recommendations?: string[];
  risk_level?: RiskLevel;
  key_concerns?: string[];
}

export interface HealthMetricsEntry {
  entry_id: string;
  user_id: string;
  timestamp: string;
  date: string;
  metrics: {
    oxygen_level?: number | null;
    systolic_bp?: number | null;
    diastolic_bp?: number | null;
    pulse_rate?: number | null;
  };
  ai_analysis?: HealthMetricsAIAnalysis | null;
  risk_level?: RiskLevel | null;
  warnings: string[];
  note?: string | null;
}


