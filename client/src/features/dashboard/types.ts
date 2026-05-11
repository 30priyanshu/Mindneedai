export interface UserDashboardStats {
  total_analyses: number;
  this_week_count: number;
  streak_days: number;
  weekly_avg_mood: number | null;
}

export interface RecentAnalysis {
  id: string;
  type: 'text' | 'video' | 'audio';
  emotion: string;
  confidence: number;
  timestamp: string | null;
}

export interface DoctorDashboardStats {
  total_patients: number;
  recent_patients_count: number;
  total_forms: number;
  recent_forms_count: number;
}

export interface RecentWellnessForm {
  form_id: string;
  user_id: string;
  client_name: string;
  patient_name: string | null;
  form_date: string | null;
  status: string;
  created_at: string | null;
}
