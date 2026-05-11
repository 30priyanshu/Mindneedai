export interface DoctorProfile {
  doctor_id: string;
  email: string;
  name: string;
  specialty?: string;
  location?: string;
  license_number?: string;
  doctor_code?: string;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  total_patients: number;
}

export interface DoctorProfileStats {
  total_patients: number;
  recent_patients_count: number;
  total_forms: number;
  recent_forms_count: number;
}

export interface UpdateDoctorProfilePayload {
  name?: string;
  specialty?: string;
  location?: string;
  license_number?: string;
}

export interface PatientSummary {
  user_id: string;
  email: string;
  name?: string | null;
  connected_at: string;
}
