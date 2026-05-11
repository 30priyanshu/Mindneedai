import api from '@/core/api';
import type { NotificationListResponse } from './types';

export const notificationApi = {
  /** Fetch paginated notifications for the current principal. */
  getNotifications: async (
    page = 1,
    size = 50,
  ): Promise<NotificationListResponse> => {
    const { data } = await api.get<NotificationListResponse>('/notifications', {
      params: { page, size },
    });
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count');
    return data.unread_count;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`, {});
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all', {});
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  clearAll: async (): Promise<void> => {
    await api.post('/notifications/clear-all', {});
  },
};
