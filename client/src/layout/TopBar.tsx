import React from 'react';
import { HelpCircle, Moon, Sun } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

export const TopBar: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header className="h-16 md:h-24 px-6 md:px-8 flex items-center justify-between relative z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 shadow-sm transition-colors duration-200">
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-primary/5 text-primary dark:text-primary-light rounded-full border border-primary/10">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs md:text-sm font-semibold tracking-wide">SYSTEM ACTIVE</span>
        </div>

        <button
          onClick={toggleTheme}
          className={cn(
            'min-h-touch min-w-touch p-2.5 rounded-xl transition-all duration-200',
            'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
            'hover:bg-neutral-100/80 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary'
          )}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={20} className="md:w-5 md:h-5" />
          ) : (
            <Moon size={20} className="md:w-5 md:h-5" />
          )}
        </button>

        <NotificationDropdown />

        <button
          className={cn(
            'min-h-touch min-w-touch p-2.5 rounded-xl transition-all duration-200',
            'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
            'hover:bg-neutral-100/80 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary'
          )}
          aria-label="Help"
        >
          <HelpCircle size={20} className="md:w-5 md:h-5" />
        </button>

        <ProfileDropdown />
      </div>
    </header>
  );
};
