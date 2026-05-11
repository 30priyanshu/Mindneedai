/** Raw notification record as returned by the backend. */
export interface NotificationRecord {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  /** Backend always sends `read` (boolean). */
  read: boolean;
  action_url?: string;
  created_at?: string;
}

/** Paginated list response from GET /notifications. */
export interface NotificationListResponse {
  items: NotificationRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  unread_count: number;
}
