import React from 'react';
import { Card } from '@/shared/components/Card';
import { Brain, AlertCircle, Lightbulb, TrendingUp, Heart, Zap } from 'lucide-react';

interface VideoAnalysisInsightsProps {
  summary?: string;
  concerningPatterns?: string[];
  recommendations?: string[];
  strengths?: string[];
  quickActions?: string[];
}

export function VideoAnalysisInsights({
  summary,
  concerningPatterns = [],
  recommendations = [],
  strengths = [],
  quickActions = [],
}: VideoAnalysisInsightsProps): React.ReactElement | null {
  const hasContent =
    Boolean(summary) ||
    concerningPatterns.length > 0 ||
    recommendations.length > 0 ||
    strengths.length > 0 ||
    quickActions.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4 animate-slideUp">
      {summary && (
        <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/10">
              <Brain className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">Your Emotional Insights</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Understanding your emotional patterns</p>
            </div>
          </div>
          <p className="text-sm text-neutral-800 dark:text-dark-text leading-relaxed">{summary}</p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {strengths.length > 0 && (
          <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
                <Heart className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">Your Strengths</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">What&apos;s working well for you</p>
              </div>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-dark-surface rounded-lg p-2 border border-neutral-200 dark:border-dark-border"
                >
                  <Heart className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-dark-text text-xs leading-snug flex-1">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {recommendations.length > 0 && (
          <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">Wellness Suggestions</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Things you can try</p>
              </div>
            </div>

            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-dark-surface rounded-lg p-2 border border-neutral-200 dark:border-dark-border"
                >
                  <TrendingUp className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-dark-text text-xs leading-snug flex-1">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {concerningPatterns.length > 0 && (
          <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">Things to Consider</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Gentle reminders for your wellbeing</p>
              </div>
            </div>

            <ul className="space-y-2">
              {concerningPatterns.map((pattern, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-dark-surface rounded-lg p-2 border border-neutral-200 dark:border-dark-border"
                >
                  <span className="text-amber-600 font-bold text-xs mt-0.5">•</span>
                  <span className="text-neutral-800 dark:text-dark-text text-xs leading-snug flex-1">{pattern}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {quickActions.length > 0 && (
          <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10">
                <Zap className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">Try Right Now</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Quick intervention suggestions</p>
              </div>
            </div>
            <ul className="space-y-2">
              {quickActions.map((action, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-dark-surface rounded-lg p-2 border border-neutral-200 dark:border-dark-border"
                >
                  <Zap className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-dark-text text-xs leading-snug flex-1">{action}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
