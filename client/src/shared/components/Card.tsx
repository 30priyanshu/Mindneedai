import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  elevated?: boolean;
}

const paddingStyles = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export const Card = ({
  children,
  className,
  padding = 'md',
  hover = false,
  elevated = false,
}: CardProps) => (
  <div
    className={cn(
      elevated ? 'card-elevated' : 'card',
      paddingStyles[padding],
      hover && 'transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-primary/30 dark:hover:border-primary/30',
      className
    )}
  >
    {children}
  </div>
);
