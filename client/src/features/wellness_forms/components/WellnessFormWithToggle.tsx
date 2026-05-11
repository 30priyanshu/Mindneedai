import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { wellnessFormApi } from '../service';
import { MentalWellnessForm } from './MentalWellnessForm';
import type { MentalWellnessFormData } from './mentalWellnessForm.types';
import { AIInsightsDisplay } from './AIInsightsDisplay';

export interface WellnessFormWithToggleProps {
  formData: MentalWellnessFormData;
  formMode: 'view' | 'edit';
  formId: string;
  userRole: 'user' | 'doctor';
  formContentId?: string;
  defaultView?: 'form' | 'insights';
}

type ViewType = 'form' | 'insights';

/** Single responsibility: tabbed layout switching between printable form and AI insights. */
export const WellnessFormWithToggle: React.FC<WellnessFormWithToggleProps> = ({
  formData,
  formMode,
  formId,
  userRole,
  formContentId = 'wellness-form-content',
  defaultView = 'form',
}) => {
  const [activeView, setActiveView] = useState<ViewType>(defaultView);
  const [insightsStatus, setInsightsStatus] = useState<string | null>(null);

  const checkInsightsStatus = useCallback(async () => {
    try {
      const data = await wellnessFormApi.getAIInsights(formId);
      setInsightsStatus(String(data.ai_generation_status));
    } catch {
      setInsightsStatus(null);
    }
  }, [formId]);

  useEffect(() => {
    void checkInsightsStatus();
  }, [checkInsightsStatus]);

  const handleViewChange = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      if (view === 'insights') void checkInsightsStatus();
    },
    [checkInsightsStatus],
  );

  const statusIndicators = useMemo(() => {
    const isProcessing = insightsStatus === 'processing';
    const hasNewInsights = insightsStatus === 'completed';
    return { isProcessing, hasNewInsights };
  }, [insightsStatus]);

  return (
    <div className="w-full">
      <div className="mb-6 print:hidden flex justify-center">
        <div
          className="inline-flex items-center gap-2 p-1.5 bg-neutral-100 dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm"
          role="tablist"
          aria-label="View selector"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'form'}
            aria-controls="form-panel"
            id="form-tab"
            onClick={() => handleViewChange('form')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleViewChange('insights');
              }
            }}
            className={cn(
              'relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-dark-card',
              activeView === 'form'
                ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-text shadow-md scale-[1.02]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
            )}
          >
            <FileText className={cn('w-4 h-4', activeView === 'form' ? 'text-primary scale-110' : '')} />
            <span>Form</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'insights'}
            aria-controls="insights-panel"
            id="insights-tab"
            onClick={() => handleViewChange('insights')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleViewChange('form');
              }
            }}
            className={cn(
              'relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-dark-card',
              activeView === 'insights'
                ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-text shadow-md scale-[1.02]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
            )}
          >
            <Sparkles className={cn('w-4 h-4', activeView === 'insights' ? 'text-primary scale-110' : '')} />
            <span>AI Insights</span>
            {statusIndicators.isProcessing && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse ring-2 ring-white dark:ring-dark-card"
                aria-label="Processing insights"
              />
            )}
            {statusIndicators.hasNewInsights && !statusIndicators.isProcessing && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white dark:ring-dark-card"
                aria-label="New insights available"
              />
            )}
          </button>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        <div
          id="form-panel"
          role="tabpanel"
          aria-labelledby="form-tab"
          className={cn(
            'transition-all duration-500 ease-in-out',
            activeView === 'form'
              ? 'opacity-100 translate-x-0 pointer-events-auto relative z-10'
              : 'opacity-0 translate-x-4 pointer-events-none absolute inset-0 z-0',
          )}
        >
          <div id={formContentId}>
            <MentalWellnessForm data={formData} mode={formMode} />
          </div>
        </div>

        <div
          id="insights-panel"
          role="tabpanel"
          aria-labelledby="insights-tab"
          className={cn(
            'transition-all duration-500 ease-in-out w-full',
            activeView === 'insights'
              ? 'opacity-100 translate-x-0 pointer-events-auto relative z-10'
              : 'opacity-0 -translate-x-4 pointer-events-none absolute inset-0 z-0',
          )}
        >
          <AIInsightsDisplay formId={formId} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};
