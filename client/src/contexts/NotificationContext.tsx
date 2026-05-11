import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { NOTIFICATION_POLL_INTERVAL_MS } from '@/core/constants';
import { notificationApi } from '@/features/notifications/service';
import { useAuth } from './AuthContext';
import type { Notification } from '@/core/types';

export interface AddNotificationInput {
  type: Notification['type'];
  title: string;
  message: string;
  action_url?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (input: AddNotificationInput) => void;
  refreshNotifications: () => Promise<void>;
}

interface BackendNotification {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at?: string;
  action_url?: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mapNotification = (n: BackendNotification): Notification => ({
  id: n.notification_id,
  type: n.type as Notification['type'],
  title: n.title,
  message: n.message,
  is_read: n.read,
  created_at: n.created_at ?? new Date().toISOString(),
  ...(n.action_url !== undefined ? { action_url: n.action_url } : {}),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications(1, 50);
      setNotifications(data.items.map(mapNotification));
      setUnreadCount(data.unread_count);
    } catch {
      // silently keep stale state on network error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshNotifications();

    if (isAuthenticated) {
      intervalRef.current = setInterval(() => void refreshNotifications(), NOTIFICATION_POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, refreshNotifications]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    await notificationApi.markAsRead(id);
    await refreshNotifications();
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    await notificationApi.markAllAsRead();
    await refreshNotifications();
  }, [refreshNotifications]);

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    await notificationApi.deleteNotification(id);
    await refreshNotifications();
  }, [refreshNotifications]);

  const clearAll = useCallback(async (): Promise<void> => {
    await notificationApi.clearAll();
    await refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = useCallback((input: AddNotificationInput): void => {
    const item: Notification = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title,
      message: input.message,
      is_read: false,
      created_at: new Date().toISOString(),
      ...(input.action_url !== undefined ? { action_url: input.action_url } : {}),
    };
    setNotifications((prev) => [item, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
