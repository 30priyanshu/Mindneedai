import type { UserRole } from '@/core/types';

export interface AuthResponse {
  token: string;
  role: UserRole;
  id: string;
  email: string;
  name: string;
  doctor_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterDoctorRequest {
  email: string;
  password: string;
  name: string;
  license_number?: string;
  specialty?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
