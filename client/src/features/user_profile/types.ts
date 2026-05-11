export interface UserProfile {
  user_id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  location?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  total_analyses: number;
  connected_doctor_id?: string;
}

export interface UserProfileStats {
  total_analyses: number;
  text_count: number;
  video_count: number;
  audio_count: number;
  most_frequent_emotion: string;
}

export interface UpdateProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  location?: string;
}

export interface DoctorInfo {
  doctor_id: string;
  name: string;
  email: string;
  specialty?: string;
  license_number?: string;
}

export interface ConnectedDoctorResponse {
  connected: boolean;
  doctor: DoctorInfo | null;
}
