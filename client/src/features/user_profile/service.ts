import api from '@/core/api';
import type { UserProfile, UserProfileStats, UpdateProfilePayload, ConnectedDoctorResponse } from './types';

export type { UserProfile, UserProfileStats, UpdateProfilePayload, DoctorInfo, ConnectedDoctorResponse } from './types';

export const userProfileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>('/user-profile');
    return data;
  },

  getStats: async (): Promise<UserProfileStats> => {
    const { data } = await api.get<UserProfileStats>('/user-profile/stats');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const { data } = await api.post<UserProfile>('/user-profile', payload);
    return data;
  },

  getConnectedDoctor: async (): Promise<ConnectedDoctorResponse> => {
    const { data } = await api.get<ConnectedDoctorResponse>('/user-profile/doctor');
    return data;
  },

  connectDoctor: async (doctorEmailOrCode: string, isCode: boolean): Promise<{ message: string }> => {
    const payload = isCode
      ? { doctor_code: doctorEmailOrCode }
      : { doctor_email: doctorEmailOrCode };
    const { data } = await api.post<{ message: string }>('/user-profile/connect-doctor', payload);
    return data;
  },

  disconnectDoctor: async (): Promise<void> => {
    await api.delete('/user-profile/disconnect');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', {
      old_password: currentPassword,
      new_password: newPassword,
    });
  },
};
