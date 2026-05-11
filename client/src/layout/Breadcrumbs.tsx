import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  analyze: 'Analysis',
  text: 'Text Analysis',
  video: 'Video Analysis',
  audio: 'Audio Analysis',
  history: 'History',
  settings: 'Settings',
  profile: 'Profile',
  help: 'Help',
};

const buildBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/dashboard' }];

  let current = '';
  for (const segment of segments) {
    current += `/${segment}`;
    const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path: current });
  }

  return crumbs;
};

export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();

  if (pathname === '/' || pathname === '/dashboard') return null;

  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="text-neutral-900 dark:text-dark-text font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className={cn(
                  'text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary rounded px-1',
                  'inline-flex items-center gap-1'
                )}
              >
                {isFirst && <Home size={16} aria-hidden="true" />}
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
