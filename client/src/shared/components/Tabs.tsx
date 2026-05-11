import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => (
  <div className="border-b border-neutral-200 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav className="-mb-px flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2.5 py-4 px-5 border-b-2 font-medium text-base transition-colors duration-150',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  </div>
);
