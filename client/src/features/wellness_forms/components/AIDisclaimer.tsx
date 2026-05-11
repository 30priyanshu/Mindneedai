import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Single responsibility: legal / safety disclaimer for AI-generated wellness insights. */
export const AIDisclaimer: React.FC = () => (
  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-amber-800 dark:text-amber-200">AI-Generated Report</p>
        <p className="text-amber-700 dark:text-amber-300 mt-1">
          Subject matter expert opinion is necessary before taking action based on this report. This content is for
          reference, knowledge, and guidance only.
        </p>
      </div>
    </div>
  </div>
);
