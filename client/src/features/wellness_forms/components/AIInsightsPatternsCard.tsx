import React from 'react';
import { AlertTriangle, Minus, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import type { WellnessAiInsightPatterns } from '../types';

const trendIcon = (trend: string) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
};

export interface AIInsightsPatternsCardProps {
  patterns: WellnessAiInsightPatterns;
}

/** Single responsibility: render structured pattern analysis list for AI insights. */
export const AIInsightsPatternsCard: React.FC<AIInsightsPatternsCardProps> = ({ patterns }) => (
  <Card padding="lg" className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border">
    <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-4">Pattern Analysis</h3>
    <div className="space-y-4">
      {patterns.mood_trend && (
        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-dark-surface rounded-lg">
          <div className="flex-shrink-0">{trendIcon(patterns.mood_trend)}</div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-dark-text">Mood Trend</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">{patterns.mood_trend}</p>
          </div>
        </div>
      )}

      {(patterns.correlations?.length ?? 0) > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Symptom Correlations</p>
          <ul className="space-y-1">
            {patterns.correlations!.map((c, i) => (
              <li key={i} className="text-sm text-blue-800 dark:text-blue-200">
                • {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(patterns.risk_indicators?.length ?? 0) > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-900 dark:text-red-100">Risk Indicators</p>
          </div>
          <ul className="space-y-1">
            {patterns.risk_indicators!.map((r, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-200">
                • {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(patterns.protective_factors?.length ?? 0) > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-900 dark:text-green-100">Protective Factors</p>
          </div>
          <ul className="space-y-1">
            {patterns.protective_factors!.map((f, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200">
                • {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {patterns.progression && (
        <div className="p-3 bg-neutral-50 dark:bg-dark-surface rounded-lg">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{patterns.progression}</p>
        </div>
      )}
    </div>
  </Card>
);
