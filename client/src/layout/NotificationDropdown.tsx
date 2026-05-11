import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/core/types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/dateTimeUtils';

const getNotificationIcon = (type: Notification['type']): React.ReactNode => {
  const base = { size: 18, className: 'flex-shrink-0' };
  switch (type) {
    case 'success':
      return <CheckCircle {...base} className={cn(base.className, 'text-accent-green')} />;
    case 'error':
      return <AlertCircle {...base} className={cn(base.className, 'text-accent-red')} />;
    case 'warning':
      return <AlertTriangle {...base} className={cn(base.className, 'text-accent-yellow')} />;
    case 'analysis':
      return <Activity {...base} className={cn(base.className, 'text-primary')} />;
    default:
      return <Info {...base} className={cn(base.className, 'text-primary')} />;
  }
};

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification): void => {
    if (!notification.is_read) void markAsRead(notification.id);
    if (notification.action_url !== undefined) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation();
    void deleteNotification(id);
  };

  const filterBtnClass = (active: boolean): string =>
    cn(
      'flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
      active
        ? 'bg-primary text-white'
        : 'bg-neutral-100 dark:bg-dark-card text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-dark-border',
    );

  const ts = (createdAt: string): number => Date.parse(createdAt);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative min-h-touch min-w-touch p-2 md:p-3 rounded-lg transition-colors',
          'hover:bg-neutral-100 dark:hover:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary',
          isOpen && 'bg-neutral-100 dark:bg-dark-card',
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} className="md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 min-w-[1.25rem] h-5 px-1.5 bg-accent-red text-white text-xs font-semibold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-dark-text">Notifications</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-dark-card rounded transition-colors"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFilter('all')} className={filterBtnClass(filter === 'all')}>
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={filterBtnClass(filter === 'unread')}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-dark-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    className={cn(
                      'p-4 transition-colors cursor-pointer group relative',
                      !notification.is_read && 'bg-primary/5 dark:bg-primary/10',
                      'hover:bg-neutral-50 dark:hover:bg-dark-card',
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={cn(
                              'text-sm font-semibold',
                              !notification.is_read
                                ? 'text-neutral-900 dark:text-dark-text'
                                : 'text-neutral-700 dark:text-neutral-300',
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {formatRelativeTime(ts(notification.created_at))}
                          </span>
                          {notification.action_url !== undefined && (
                            <ExternalLink
                              size={14}
                              className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-200 dark:hover:bg-dark-border rounded transition-all"
                        aria-label="Delete notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => void clearAll()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
