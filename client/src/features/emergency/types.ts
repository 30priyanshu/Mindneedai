export interface EmergencyContact {
  doctor_enabled: boolean;
  doctor_email: string | null;
  loved_one_enabled: boolean;
  loved_one_email: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyAlertHistory {
  timestamp: string;
  analysis_type: 'text' | 'speech' | 'video';
  emergency_condition: string;
  risk_score: number | null;
  doctor_notified: boolean;
  loved_one_notified: boolean;
  alert_status: string;
}

export interface EmergencyContactResponse {
  user_id: string;
  doctor_enabled: boolean;
  doctor_email: string | null;
  loved_one_enabled: boolean;
  loved_one_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyAlertHistoryResponse {
  status: string;
  alerts: EmergencyAlertHistory[];
  total_alerts: number;
}

export interface CooldownStatusResponse {
  in_cooldown: boolean;
  last_alert: string | null;
  hours_remaining: number | null;
  message: string;
}

export interface SystemStatusResponse {
  emergency_system_enabled: boolean;
  email_service_configured: boolean;
  database_connected: boolean;
  smtp_connection_status: {
    status: string;
    message: string;
    host: string;
    port: number;
  };
}
