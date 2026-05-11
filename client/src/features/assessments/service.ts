import api from '@/core/api';
import type {
  AssessmentRequest,
  AssessmentSubmissionResponse,
  AssessmentResult,
  AssessmentQuestion,
  DoctorAssessmentRequest,
  AssessmentType,
  DoctorPatientOption,
} from './types';

export type {
  AssessmentType,
  AssessmentStatus,
  AssessmentRequest,
  AssessmentSubmissionResponse,
  AssessmentResult,
  AssessmentResultSummary,
  AssessmentQuestion,
  DoctorAssessmentRequest,
  DoctorPatientOption,
} from './types';

interface QuestionnaireDefinition {
  assessment_type: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  score_range: string;
  scoring_guide: string;
}

export const assessmentApi = {
  getQuestionnaire: async (type: AssessmentType): Promise<QuestionnaireDefinition> => {
    const path = type === 'PHQ9' ? '/assessments/questionnaires/phq9' : '/assessments/questionnaires/gad7';
    const { data } = await api.get<QuestionnaireDefinition>(path);
    return data;
  },

  getAvailableRequests: async (): Promise<AssessmentRequest[]> => {
    const { data } = await api.get<AssessmentRequest[]>('/assessments/requests/available');
    return data ?? [];
  },

  submitPHQ9: async (
    responses: Record<string, number>,
    requestId: string,
  ): Promise<AssessmentSubmissionResponse> => {
    const { data } = await api.post<AssessmentSubmissionResponse>('/assessments/phq9', {
      responses,
      assessment_request_id: requestId,
    });
    return data;
  },

  submitGAD7: async (
    responses: Record<string, number>,
    requestId: string,
  ): Promise<AssessmentSubmissionResponse> => {
    const { data } = await api.post<AssessmentSubmissionResponse>('/assessments/gad7', {
      responses,
      assessment_request_id: requestId,
    });
    return data;
  },

  getHistory: async (
    page = 1,
    size = 20,
  ): Promise<AssessmentResult[]> => {
    const { data } = await api.get<AssessmentResult[]>(
      '/assessments/history',
      { params: { page, size } },
    );
    return data ?? [];
  },

  createRequest: async (
    patientId: string,
    types: AssessmentType[],
    notes?: string,
    expiresInDays = 30,
  ): Promise<DoctorAssessmentRequest[]> => {
    const { data } = await api.post<DoctorAssessmentRequest[]>(`/assessments/requests/${patientId}`, {
      assessment_types: types,
      expires_in_days: expiresInDays,
      notes,
    });
    return data;
  },

  getDoctorRequests: async (): Promise<DoctorAssessmentRequest[]> => {
    const { data } = await api.get<DoctorAssessmentRequest[]>('/assessments/doctor/requests');
    return data ?? [];
  },

  getDoctorPatients: async (): Promise<DoctorPatientOption[]> => {
    const { data } = await api.get<DoctorPatientOption[]>('/assessments/doctor/patients');
    return data ?? [];
  },

  /** Doctor: get completed assessments for a specific patient */
  getPatientAssessments: async (
    patientId: string,
    page = 1,
    size = 20,
    assessmentType?: AssessmentType,
  ): Promise<AssessmentResult[]> => {
    const { data } = await api.get<AssessmentResult[]>(`/assessments/patient/${patientId}`, {
      params: { page, size, assessment_type: assessmentType },
    });
    return data ?? [];
  },

  cancelRequest: async (requestId: string): Promise<void> => {
    await api.delete(`/assessments/requests/${requestId}`);
  },
};
