import api from '@/core/api';
import type {
  WellnessFormData,
  WellnessFormResponse,
  UpdateWellnessFormData,
  WellnessAiInsightsResponse,
} from './types';

export type {
  WellnessFormData,
  WellnessFormResponse,
  UpdateWellnessFormData,
  WellnessAiInsightsResponse,
} from './types';

export const wellnessFormApi = {
  /** Doctor: create a new wellness form for a patient */
  create: async (payload: WellnessFormData): Promise<WellnessFormResponse> => {
    const { data } = await api.post<WellnessFormResponse>('/wellness-forms', payload);
    return data;
  },

  getById: async (formId: string): Promise<WellnessFormResponse> => {
    const { data } = await api.get<WellnessFormResponse>(`/wellness-forms/${formId}`);
    return data;
  },

  /** Patient: get their own forms */
  getUserForms: async (page = 1, size = 20): Promise<WellnessFormResponse[]> => {
    const { data } = await api.get<WellnessFormResponse[]>('/wellness-forms/mine', {
      params: { page, size },
    });
    return data ?? [];
  },

  /** Doctor: get all forms they've created, optionally filtered by patient */
  getDoctorForms: async (
    patientId?: string,
    page = 1,
    size = 20,
  ): Promise<WellnessFormResponse[]> => {
    const { data } = await api.get<WellnessFormResponse[]>('/wellness-forms', {
      params: { patient_id: patientId, page, size },
    });
    return data ?? [];
  },

  update: async (formId: string, payload: UpdateWellnessFormData): Promise<WellnessFormResponse> => {
    const { data } = await api.put<WellnessFormResponse>(`/wellness-forms/${formId}`, payload);
    return data;
  },

  delete: async (formId: string): Promise<void> => {
    await api.delete(`/wellness-forms/${formId}`);
  },

  getAIInsights: async (formId: string): Promise<WellnessAiInsightsResponse> => {
    const { data } = await api.get<WellnessAiInsightsResponse>(
      `/wellness-forms/${formId}/ai-summary`,
    );
    return data;
  },

  regenerateAIInsights: async (formId: string): Promise<WellnessFormResponse> => {
    const { data } = await api.post<WellnessFormResponse>(
      `/wellness-forms/${formId}/regenerate-ai`,
    );
    return data;
  },

  sendAIReportToPatient: async (
    formId: string,
    editedPatientSummary?: string,
  ): Promise<{ message: string; form_id: string; status: string }> => {
    const { data } = await api.post<{ message: string; form_id: string; status: string }>(
      `/wellness-forms/${formId}/send-ai-report-to-patient`,
      editedPatientSummary ? { edited_patient_summary: editedPatientSummary } : {},
    );
    return data;
  },
};
