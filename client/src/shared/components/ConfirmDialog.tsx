import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-accent-red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-accent-red',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-accent-amber',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-accent-amber',
    buttonVariant: 'accent' as const,
  },
  info: {
    icon: Info,
    iconColor: 'text-primary',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    borderColor: 'border-primary',
    buttonVariant: 'primary' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-accent-green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-accent-green',
    buttonVariant: 'accent' as const,
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} size="md">
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={loading}
            loadingText="Processing..."
            size="md"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className={`flex items-center gap-4 p-5 rounded-xl border-2 ${config.bgColor} ${config.borderColor}`}>
          <div className="flex-shrink-0">
            <Icon size={32} className={config.iconColor} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-2 leading-comfortable">
              {title}
            </h3>
            <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {variant === 'danger' && (
          <div className="p-4 bg-neutral-100 dark:bg-dark-card rounded-lg border border-neutral-200 dark:border-dark-border">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <strong className="font-semibold">Please note:</strong> This action cannot be undone. Make sure you want to proceed before confirming.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
