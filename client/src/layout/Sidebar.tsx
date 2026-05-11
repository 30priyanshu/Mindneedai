import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Video,
  Mic,
  History,
  Settings,
  User,
  HelpCircle,
  ChevronRight,
  Activity,
  PanelLeftClose,
  Calendar,
  Users,
  Stethoscope,
  UserCheck,
  ClipboardList,
} from 'lucide-react';

import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: {
    label: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

const userNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={24} />,
  },
  {
    label: 'Mood Tracker',
    path: '/mood',
    icon: <Calendar size={24} />,
  },
  {
    label: 'Analysis',
    path: '/analyze',
    icon: <Activity size={24} />,
    children: [
      {
        label: 'Text Analysis',
        path: '/analyze/text',
        icon: <FileText size={20} />,
      },
      {
        label: 'Video Analysis',
        path: '/analyze/video',
        icon: <Video size={20} />,
      },
      {
        label: 'Audio Analysis',
        path: '/analyze/audio',
        icon: <Mic size={20} />,
      },
    ],
  },
  {
    label: 'Connect Doctor',
    path: '/connect-doctor',
    icon: <UserCheck size={24} />,
  },
  {
    label: 'Assessments',
    path: '/assessments',
    icon: <ClipboardList size={24} />,
  },
  {
    label: 'Wellness Forms',
    path: '/wellness-forms',
    icon: <FileText size={24} />,
  },
  {
    label: 'History',
    path: '/history',
    icon: <History size={24} />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings size={24} />,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: <User size={24} />,
  },
  {
    label: 'Help',
    path: '/help',
    icon: <HelpCircle size={24} />,
  },
];

const doctorNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/doctor/dashboard',
    icon: <LayoutDashboard size={24} />,
  },
  {
    label: 'Patients',
    path: '/doctor/patients',
    icon: <Users size={24} />,
  },
  {
    label: 'Wellness Forms',
    path: '/wellness-forms',
    icon: <FileText size={24} />,
  },
  {
    label: 'Create Wellness Form',
    path: '/doctor/create-wellness-form',
    icon: <Stethoscope size={24} />,
  },
  {
    label: 'Patient Assessments',
    path: '/doctor/patient-assessments',
    icon: <ClipboardList size={24} />,
  },
  {
    label: 'Profile',
    path: '/doctor/profile',
    icon: <User size={24} />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings size={24} />,
  },
  {
    label: 'Help',
    path: '/help',
    icon: <HelpCircle size={24} />,
  },
];

const isPathActive = (
  path: string,
  locationPath: string
): boolean => {
  if (
    path === '/dashboard' ||
    path === '/doctor/dashboard'
  ) {
    return (
      locationPath === '/' ||
      locationPath === '/dashboard' ||
      locationPath === '/doctor/dashboard'
    );
  }

  if (path === '/analyze') {
    return locationPath.startsWith('/analyze');
  }

  if (path === '/assessments') {
    return locationPath.startsWith('/assessments');
  }

  if (path === '/wellness-forms') {
    return locationPath.startsWith('/wellness-forms');
  }

  if (path === '/doctor/patient-assessments') {
    return locationPath.startsWith(
      '/doctor/patient-assessments'
    );
  }

  return locationPath === path;
};

export const Sidebar: React.FC = () => {
  const { collapsed, toggleCollapsed } = useSidebar();

  const [analysisExpanded, setAnalysisExpanded] =
    useState(true);

  const location = useLocation();

  const { role } = useAuth();

  const isMobile = useIsMobile();

  const navItems = useMemo(
    () =>
      role === 'doctor'
        ? doctorNavItems
        : userNavItems,
    [role]
  );

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl transition-all duration-200 min-h-touch group',
      'hover:bg-neutral-50 dark:hover:bg-white/5',
      'focus:outline-none focus:ring-2 focus:ring-primary',
      active
        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-semibold'
        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
      collapsed
        ? 'justify-center px-3 py-3'
        : 'px-4 py-3.5'
    );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-dark-surface border-r border-neutral-100 dark:border-dark-border transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-[4.5rem]' : 'w-[18rem]',
        isMobile &&
        (collapsed
          ? 'w-0 overflow-hidden'
          : 'w-[18rem] shadow-2xl')
      )}
      style={{ zIndex: 40 }}
    >
      {/* Logo */}
      <div className="h-24 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 relative group">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 transition-transform hover:scale-[1.02]',
            collapsed
              ? 'mx-auto'
              : 'flex-1 overflow-hidden'
          )}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25 border border-teal-400/20">
            <Activity
              size={24}
              className="text-white"
              strokeWidth={2.5}
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden pr-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                MindNeed
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                  AI
                </span>
              </h1>
            </div>
          )}
        </Link>

        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className={cn(
              'absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-500 hover:border-teal-400/50 shadow-md transition-all z-50',
              collapsed && 'rotate-180'
            )}
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            <PanelLeftClose
              size={14}
              strokeWidth={2.5}
              className="ml-[1px]"
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 min-h-0 custom-scrollbar">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const hasChildren =
              !!item.children?.length;

            const active = isPathActive(
              item.path,
              location.pathname
            );

            return (
              <li key={item.path}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() =>
                        setAnalysisExpanded(
                          !analysisExpanded
                        )
                      }
                      className={navLinkClass(active)}
                      aria-expanded={
                        analysisExpanded
                      }
                    >
                      <span className="flex-shrink-0">
                        {item.icon}
                      </span>

                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left font-medium">
                            {item.label}
                          </span>

                          <ChevronRight
                            size={20}
                            className={cn(
                              'transition-transform flex-shrink-0',
                              analysisExpanded &&
                              'rotate-90'
                            )}
                          />
                        </>
                      )}
                    </button>

                    {!collapsed &&
                      analysisExpanded && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {item.children?.map(
                            (child) => (
                              <li
                                key={child.path}
                              >
                                <Link
                                  to={child.path}
                                  className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors min-h-touch',
                                    'hover:bg-neutral-50 dark:hover:bg-white/5',
                                    'focus:outline-none focus:ring-2 focus:ring-primary',
                                    location.pathname ===
                                      child.path
                                      ? 'text-primary dark:text-primary-light font-semibold bg-primary/5 dark:bg-primary/10'
                                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                  )}
                                >
                                  <span className="flex-shrink-0">
                                    {
                                      child.icon
                                    }
                                  </span>

                                  <span className="font-medium">
                                    {
                                      child.label
                                    }
                                  </span>
                                </Link>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={navLinkClass(
                      active
                    )}
                  >
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <span className="font-medium">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};