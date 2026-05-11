import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

export const AppLayout: React.FC = () => {
  const { collapsed } = useSidebar();
  const isMobile = useIsMobile();

  const sidebarWidth = collapsed ? '4.5rem' : '18rem';

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-dark-bg">
      <Sidebar />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={!isMobile ? { marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth})` } : {}}
      >
        <TopBar />

        <main
          id="main-content"
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-neutral-50 dark:bg-dark-bg w-full max-w-full"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
