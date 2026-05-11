export type AssessmentType = 'PHQ9' | 'GAD7';

export interface AssessmentQuestionOption {
  value: number;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: AssessmentQuestionOption[];
}
export type AssessmentStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

export interface AssessmentRequest {
  request_id: string;
  doctor_id: string;
  patient_id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  notes?: string;
  created_at: string;
  expires_at?: string;
  completed_at?: string;
}

export interface AssessmentSubmissionResponse {
  assessment_id: string;
  message: string;
  created_at: string;
}

export interface AssessmentResult {
  assessment_id: string;
  user_id: string;
  assessment_type: AssessmentType;
  score: number;
  severity_level: string;
  severity_label: string;
  treatment_recommendations: {
    severity: string;
    treatment: string;
    score_range: string;
  };
  responses: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/** Lightweight result summary embedded in a doctor's assessment request. */
export interface AssessmentResultSummary {
  score: number;
  severity_level: string;
  severity_label: string;
}

export interface DoctorAssessmentRequest {
  request_id: string;
  patient_id: string;
  patient_email?: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  notes?: string;
  created_at: string;
  expires_at?: string;
  completed_at?: string;
  result?: AssessmentResultSummary;
}

/** Shape returned by GET /assessments/doctor/patients */
export interface DoctorPatientOption {
  id: string;
  name: string;
}
