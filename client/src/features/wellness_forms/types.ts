export interface WellnessFormData {
  /** The patient's user_id (required, populated by doctor selecting a patient) */
  user_id: string;
  client_name: string;
  form_date: string;
  form_data: Record<string, unknown>;
  status?: 'draft' | 'submitted';
}

export interface WellnessFormResponse {
  form_id: string;
  user_id: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_email?: string;
  doctor_specialty?: string;
  client_name: string;
  form_date: string;
  form_data: Record<string, unknown>;
  status: 'draft' | 'submitted' | 'reviewed';
  ai_generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_summary_clinical?: string | null;
  ai_summary_patient?: string | null;
  ai_patterns_detected?: WellnessAiInsightPatterns | null;
  ai_generated_at?: string | null;
  ai_model_version?: string | null;
  ai_report_status: 'pending_review' | 'sent_to_patient';
  ai_report_sent_at?: string | null;
  ai_error_message?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateWellnessFormData {
  client_name?: string;
  form_date?: string;
  form_data?: Record<string, unknown>;
  status?: 'draft' | 'submitted' | 'reviewed';
}

export type AiGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AiReportStatus = 'pending_review' | 'sent_to_patient';

export interface WellnessAiInsightPatterns {
  mood_trend?: string;
  severity_change?: string;
  correlations?: string[];
  risk_indicators?: string[];
  protective_factors?: string[];
  progression?: string;
  severity_score?: number;
}

/** Full AI summary payload from GET /wellness-forms/:id/ai-summary */
export interface WellnessAiInsightsResponse {
  form_id: string;
  ai_generation_status: AiGenerationStatus | string;
  clinical_summary?: string;
  patient_summary?: string;
  patterns_detected?: WellnessAiInsightPatterns;
  generated_at?: string;
  model_version?: string;
  error_message?: string;
  client_name?: string;
  form_date?: string;
  ai_report_status?: AiReportStatus | string;
  ai_report_sent_at?: string;
}
