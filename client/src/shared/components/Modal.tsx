import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { trapFocus } from '@/utils/accessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousActiveElement.current?.focus();
      return;
    }

    previousActiveElement.current = document.activeElement as HTMLElement;

    if (!modalRef.current) return;

    const cleanup = trapFocus(modalRef.current);
    const firstFocusable = modalRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return cleanup;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border-2 border-neutral-200 dark:border-dark-border',
          'animate-scaleIn',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-start justify-between p-7 border-b-2 border-neutral-200 dark:border-dark-border">
            <div className="flex-1 pr-4">
              <h2
                id="modal-title"
                className="text-2xl font-bold text-neutral-900 dark:text-dark-text mb-2 leading-comfortable"
              >
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'min-h-touch min-w-touch p-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-neutral-100 dark:hover:bg-dark-card hover:scale-110',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'flex-shrink-0'
                )}
                aria-label="Close modal"
              >
                <X size={26} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        <div className="p-7 overflow-y-auto max-h-[calc(100vh-18rem)] custom-scrollbar leading-relaxed">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-4 p-7 border-t-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
