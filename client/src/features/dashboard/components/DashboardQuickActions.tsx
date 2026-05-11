import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, Mic } from 'lucide-react';
import { cn } from '@/utils/cn';

export function DashboardQuickActions(): React.ReactElement {
  return (
    <div className="card-elevated">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-dark-text mb-2">Start New Analysis</h2>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Choose the type of analysis you&apos;d like to perform
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <Link
          to="/analyze/text"
          className={cn(
            'flex flex-col items-center gap-4 md:gap-5 p-5 md:p-7 rounded-xl border-2 border-neutral-200 dark:border-dark-border',
            'hover:border-primary dark:hover:border-primary-light hover:bg-neutral-50 dark:hover:bg-dark-card',
            'transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg group',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          )}
        >
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-xl flex items-center justify-center bg-primary/10 group-hover:scale-110 transition-transform duration-200">
            <FileText size={32} className="md:w-9 md:h-9 text-primary" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-dark-text mb-2">
              Text Analysis
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Analyze written text for emotions and get personalized insights
            </p>
          </div>
        </Link>

        <Link
          to="/analyze/video"
          className={cn(
            'flex flex-col items-center gap-4 md:gap-5 p-5 md:p-7 rounded-xl border-2 border-neutral-200 dark:border-dark-border',
            'hover:border-secondary dark:hover:border-secondary-light hover:bg-neutral-50 dark:hover:bg-dark-card',
            'transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg group',
            'focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2',
          )}
        >
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-xl flex items-center justify-center bg-secondary/10 group-hover:scale-110 transition-transform duration-200">
            <Video size={32} className="md:w-9 md:h-9 text-secondary" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-dark-text mb-2">
              Video Analysis
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Analyze facial expressions in real-time video
            </p>
          </div>
        </Link>

        <Link
          to="/analyze/audio"
          className={cn(
            'flex flex-col items-center gap-4 md:gap-5 p-5 md:p-7 rounded-xl border-2 border-neutral-200 dark:border-dark-border',
            'hover:border-accent-amber dark:hover:border-accent-amber hover:bg-neutral-50 dark:hover:bg-dark-card',
            'transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg group',
            'focus:outline-none focus:ring-2 focus:ring-accent-amber focus:ring-offset-2',
          )}
        >
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-xl flex items-center justify-center bg-amber-500/10 group-hover:scale-110 transition-transform duration-200">
            <Mic size={32} className="md:w-9 md:h-9 text-accent-amber" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-dark-text mb-2">
              Audio Analysis
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Analyze voice tone and emotional patterns
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
