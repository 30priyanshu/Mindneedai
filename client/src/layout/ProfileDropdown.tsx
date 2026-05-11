import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  History,
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

const userMenuItems = (nav: (path: string) => void): MenuItem[] => [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', action: () => nav('/dashboard') },
  { icon: <User size={18} />, label: 'Profile', action: () => nav('/profile') },
  { icon: <UserCheck size={18} />, label: 'Connect Doctor', action: () => nav('/connect-doctor') },
  { icon: <FileText size={18} />, label: 'Wellness Forms', action: () => nav('/wellness-forms') },
  { icon: <History size={18} />, label: 'History', action: () => nav('/history') },
  { icon: <Settings size={18} />, label: 'Settings', action: () => nav('/settings') },
  { icon: <HelpCircle size={18} />, label: 'Help & Support', action: () => nav('/help') },
];

const doctorMenuItems = (nav: (path: string) => void): MenuItem[] => [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', action: () => nav('/doctor/dashboard') },
  { icon: <Users size={18} />, label: 'Patients', action: () => nav('/doctor/patients') },
  {
    icon: <Stethoscope size={18} />,
    label: 'Create Wellness Form',
    action: () => nav('/doctor/create-wellness-form'),
  },
  { icon: <User size={18} />, label: 'Profile', action: () => nav('/doctor/profile') },
  { icon: <Settings size={18} />, label: 'Settings', action: () => nav('/settings') },
  { icon: <HelpCircle size={18} />, label: 'Help & Support', action: () => nav('/help') },
];

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { name, email, role, logout } = useAuth();

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

  const nav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const menuItems = useMemo(
    () => (role === 'doctor' ? doctorMenuItems(nav) : userMenuItems(nav)),
    [role]
  );

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 md:gap-3 min-h-touch px-2 md:px-4 py-2 rounded-lg transition-colors',
          'hover:bg-neutral-100 dark:hover:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary',
          isOpen && 'bg-neutral-100 dark:bg-dark-card'
        )}
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
          <User size={16} className="md:w-5 md:h-5 text-primary" />
        </div>
        <div className="hidden xl:block text-left">
          <p className="font-medium text-xs md:text-sm text-neutral-900 dark:text-dark-text">
            {name || 'User'}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {role === 'doctor' ? 'Doctor' : 'Welcome back'}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={cn('hidden md:block text-neutral-500 transition-transform flex-shrink-0', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-4 border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                <User size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-dark-text truncate">{name || 'User'}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{email || 'No email'}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-card transition-colors"
              >
                <span className="text-neutral-500 dark:text-neutral-400">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <div className="px-2 py-2 border-t border-neutral-200 dark:border-dark-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-card rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </span>
                Theme
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-neutral-200 dark:border-dark-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
