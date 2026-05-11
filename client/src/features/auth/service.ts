import api from '@/core/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterUserRequest,
  RegisterDoctorRequest,
  ChangePasswordRequest,
} from './types';

export type {
  AuthResponse,
  LoginRequest,
  RegisterUserRequest,
  RegisterDoctorRequest,
  ChangePasswordRequest,
} from './types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  registerUser: async (payload: RegisterUserRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register/user', payload);
    return data;
  },

  registerDoctor: async (payload: RegisterDoctorRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register/doctor', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout', {});
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/change-password', payload);
    return data;
  },
};
