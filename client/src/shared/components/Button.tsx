import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  pulse?: boolean;
  fullWidth?: boolean;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap';

const variantStyles = {
  primary:
    'bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:shadow-lg shadow-sm disabled:hover:bg-neutral-900 dark:disabled:hover:bg-white disabled:hover:shadow-sm border border-transparent',
  secondary:
    'bg-white dark:bg-dark-surface text-neutral-700 dark:text-dark-text border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-dark-card hover:border-neutral-300 dark:hover:border-neutral-600 shadow-sm hover:shadow',
  accent:
    'bg-secondary dark:bg-secondary-dark text-white hover:bg-secondary-dark dark:hover:bg-secondary hover:shadow-lg hover:shadow-secondary/20 shadow-sm disabled:hover:bg-secondary dark:disabled:hover:bg-secondary-dark disabled:hover:shadow-sm border border-transparent',
  ghost:
    'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5',
  danger:
    'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 shadow-sm disabled:hover:bg-red-500 dark:disabled:hover:bg-red-600 disabled:hover:shadow-sm border border-transparent',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm min-h-[44px]',
  md: 'px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base min-h-touch',
  lg: 'px-7 md:px-8 py-3.5 md:py-4 text-base md:text-lg min-h-[56px] md:min-h-[60px]',
};

const iconSizes = { sm: 16, md: 18, lg: 20 };

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Processing...',
  icon,
  iconPosition = 'left',
  pulse = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      loading && 'opacity-70 cursor-wait hover:scale-100',
      pulse && !loading && 'animate-pulse-gentle',
      disabled && 'hover:scale-100 active:scale-100 opacity-50',
      fullWidth && 'w-full',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <>
        <Loader2 size={iconSizes[size]} className="animate-spin" />
        <span>{loadingText}</span>
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && <span className="inline-flex items-center">{icon}</span>}
        <span className="inline-flex items-center">{children}</span>
        {icon && iconPosition === 'right' && <span className="inline-flex items-center">{icon}</span>}
      </>
    )}
  </button>
);
