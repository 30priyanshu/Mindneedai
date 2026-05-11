import React from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  className,
}) => {
  const id = React.useId();
  const labelId = `switch-label-${id}`;
  const descriptionId = `switch-desc-${id}`;

  const handleToggle = () => {
    if (!disabled && !loading) onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled || loading}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary dark:bg-primary-light' : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-7' : 'translate-x-1'
          )}
        >
          {loading && (
            <span className="flex h-full w-full items-center justify-center">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-primary" />
            </span>
          )}
        </span>
      </button>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              id={labelId}
              className="text-base font-medium text-neutral-900 dark:text-dark-text cursor-pointer"
              onClick={handleToggle}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
