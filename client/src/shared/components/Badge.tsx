import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'info', className }: BadgeProps) => (
  <span className={cn('badge', `badge-${variant}`, className)}>
    {children}
  </span>
);
