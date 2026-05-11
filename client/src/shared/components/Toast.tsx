import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, Toast as ToastType } from '@/contexts/ToastContext';
import { cn } from '@/utils/cn';

const toastIcons: Record<ToastType['type'], React.ReactNode> = {
  success: <CheckCircle size={28} strokeWidth={2.5} />,
  error: <AlertCircle size={28} strokeWidth={2.5} />,
  warning: <AlertTriangle size={28} strokeWidth={2.5} />,
  info: <Info size={28} strokeWidth={2.5} />,
};

const toastStyles: Record<ToastType['type'], string> = {
  success:
    'bg-white dark:bg-dark-surface border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 border-l-emerald-600',
  error:
    'bg-white dark:bg-dark-surface border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 border-l-red-600',
  warning:
    'bg-white dark:bg-dark-surface border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 border-l-amber-600',
  info:
    'bg-white dark:bg-dark-surface border border-primary/30 dark:border-primary/40 text-primary-700 dark:text-primary-light border-l-primary',
};

interface ToastItemProps {
  toast: ToastType;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = React.useState(false);

  const handleClose = () => {
    setIsExiting(true);
    const timer = setTimeout(() => removeToast(toast.id), 300);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(handleClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-5 rounded-xl border-l-[6px] shadow-xl min-w-[360px] max-w-lg',
        'animate-slideInRight transition-all duration-300',
        toastStyles[toast.type],
        toast.type === 'success' && 'animate-success-pop',
        isExiting && 'opacity-0 translate-x-full'
      )}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 mt-1">{toastIcons[toast.type]}</div>

      <div className="flex-1 min-w-0">
        <p className="text-neutral-900 dark:text-dark-text font-semibold text-base leading-relaxed">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-3 text-sm font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 min-h-touch"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 p-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-dark-card/50',
          'focus:outline-none focus:ring-2 focus:ring-primary min-w-touch min-h-touch transition-colors'
        )}
        aria-label="Close notification"
      >
        <X size={22} className="text-neutral-600 dark:text-neutral-400" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 right-0 z-[9999] p-4 space-y-2 max-w-md pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
