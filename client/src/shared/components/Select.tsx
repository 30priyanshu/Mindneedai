import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    if (searchable && searchInputRef.current) searchInputRef.current.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-base font-medium text-neutral-900 dark:text-dark-text mb-2">
          {label}
        </label>
      )}

      <div ref={selectRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-4 py-3 min-h-touch',
            'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-text',
            'border-2 rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error ? 'border-accent-red' : 'border-neutral-300 dark:border-dark-border',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-dark-card'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={cn(!selectedOption && 'text-neutral-400 dark:text-neutral-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={20} className={cn('transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border animate-fadeIn max-h-64 overflow-hidden flex flex-col">
            {searchable && (
              <div className="p-2 border-b border-neutral-200 dark:border-dark-border">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="overflow-y-auto py-1" role="listbox">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-3 min-h-touch',
                      'hover:bg-neutral-100 dark:hover:bg-dark-card transition-colors',
                      'focus:outline-none focus:bg-neutral-100 dark:focus:bg-dark-card',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      option.value === value && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <span className="text-neutral-900 dark:text-dark-text font-medium">{option.label}</span>
                    {option.value === value && (
                      <Check size={20} className="text-primary dark:text-primary-light" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-accent-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
