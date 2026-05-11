import api from '@/core/api';
import type {
  DoctorProfile,
  DoctorProfileStats,
  UpdateDoctorProfilePayload,
  PatientSummary,
} from './types';

export type { DoctorProfile, DoctorProfileStats, UpdateDoctorProfilePayload, PatientSummary } from './types';

export const doctorProfileApi = {
  getProfile: async (): Promise<DoctorProfile> => {
    const { data } = await api.get<DoctorProfile>('/doctors/profile');
    return data;
  },

  getStats: async (): Promise<DoctorProfileStats> => {
    const { data } = await api.get<DoctorProfileStats>('/doctors/profile/stats');
    return data;
  },

  updateProfile: async (payload: UpdateDoctorProfilePayload): Promise<DoctorProfile> => {
    const { data } = await api.put<DoctorProfile>('/doctors/profile', payload);
    return data;
  },

  regenerateCode: async (): Promise<DoctorProfile> => {
    const { data } = await api.post<DoctorProfile>('/doctors/code/regenerate');
    return data;
  },

  getPatients: async (page = 1, size = 20): Promise<PatientSummary[]> => {
    const { data } = await api.get<{ items?: PatientSummary[]; data?: PatientSummary[] }>('/doctors/patients', {
      params: { page, size },
    });
    return data?.items ?? data?.data ?? [];
  },

  disconnectPatient: async (patientId: string): Promise<void> => {
    await api.delete(`/doctors/patients/${patientId}/disconnect`);
  },
};
