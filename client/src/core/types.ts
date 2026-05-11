export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export type UserRole = 'user' | 'doctor';

export type { ApiError } from '@/core/exceptions';

export type AnalysisModality = 'text' | 'speech' | 'video';

export type EmotionCategory =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'neutral'
  | 'fearful'
  | 'disgusted'
  | 'surprised';

export type CareUrgency = 'routine' | 'priority' | 'urgent' | 'critical';

export type RiskLevel = 'normal' | 'caution' | 'danger';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'analysis';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}
