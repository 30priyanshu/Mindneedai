import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online: 'bg-accent-green',
  offline: 'bg-neutral-400',
  away: 'bg-accent-amber',
  busy: 'bg-accent-red',
};

const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}) => {
  const initials = name ? getInitials(name) : '';

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center overflow-hidden',
          'bg-primary text-white font-semibold',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'User avatar'}
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User size={size === 'xl' ? 32 : size === 'lg' ? 24 : size === 'sm' ? 16 : 20} />
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-dark-surface',
            statusColors[status],
            size === 'xl' ? 'w-5 h-5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
