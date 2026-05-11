import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 min-w-[200px] py-2 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border z-50 animate-fadeIn',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-touch',
                'hover:bg-neutral-100 dark:hover:bg-dark-card',
                'focus:outline-none focus:bg-neutral-100 dark:focus:bg-dark-card',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              role="menuitem"
              tabIndex={0}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="flex-1 text-neutral-900 dark:text-dark-text font-medium">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface DropdownButtonProps {
  label: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({ label, items, align = 'right', className }) => (
  <Dropdown
    trigger={
      <button
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 min-h-touch',
          'bg-white dark:bg-dark-surface text-neutral-700 dark:text-dark-text',
          'border-2 border-neutral-300 dark:border-dark-border rounded-lg',
          'hover:bg-neutral-50 dark:hover:bg-dark-card transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          className
        )}
      >
        <span className="font-medium">{label}</span>
        <ChevronDown size={20} />
      </button>
    }
    items={items}
    align={align}
  />
);
