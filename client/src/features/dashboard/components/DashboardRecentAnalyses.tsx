import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, Mic, Activity, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/utils/cn';
import type { RecentAnalysis } from '@/features/dashboard/types';

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  fear: '😨',
  depressed: '😞',
  anxious: '😰',
  neutral: '😐',
  surprise: '😲',
  surprised: '😲',
  disgust: '🤢',
  disgusted: '🤢',
  positive: '😊',
  negative: '😔',
};

function emotionTextClass(emotion: string): string {
  const key = emotion.toLowerCase();
  const colors: Record<string, string> = {
    happy: 'text-emerald-500',
    sad: 'text-blue-400',
    angry: 'text-red-500',
    fearful: 'text-amber-500',
    fear: 'text-amber-500',
    depressed: 'text-purple-400',
    anxious: 'text-amber-500',
    neutral: 'text-neutral-400',
    surprise: 'text-pink-500',
    surprised: 'text-pink-500',
    disgust: 'text-green-600',
    positive: 'text-emerald-500',
    negative: 'text-red-400',
  };
  return colors[key] ?? 'text-neutral-400';
}

interface Props {
  loadingAnalyses: boolean;
  analyses: RecentAnalysis[];
}

export function DashboardRecentAnalyses({ loadingAnalyses, analyses }: Props): React.ReactElement {
  if (loadingAnalyses) {
    return (
      <div className="card-elevated">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="card-elevated">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-dark-card rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Activity size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-dark-text mb-2">No analyses yet</h3>
          <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            Start your wellness journey by performing your first analysis above
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <Sparkles size={18} className="text-primary" />
            <p className="text-sm text-primary font-medium">Your insights await!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-dark-text mb-1">Recent Analyses</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Your latest emotional wellness checks</p>
        </div>
        <Link to="/history">
          <Button variant="ghost" size="sm" icon={<ArrowRight size={20} />} iconPosition="right">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-4 mt-5">
        {analyses.map((analysis, index) => (
          <div
            key={analysis.id}
            className="flex items-center justify-between p-5 rounded-xl border-2 border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-card hover:border-primary/30 transition-all duration-200 hover:shadow-md cursor-pointer animate-slideUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-dark-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                {analysis.type === 'text' && <FileText size={24} className="text-primary" strokeWidth={2.5} />}
                {analysis.type === 'video' && <Video size={24} className="text-secondary" strokeWidth={2.5} />}
                {analysis.type === 'audio' && <Mic size={24} className="text-accent-amber" strokeWidth={2.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-neutral-900 dark:text-dark-text truncate">
                  {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)} Analysis
                </p>
                {analysis.timestamp && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    {new Date(analysis.timestamp).toLocaleDateString()} at{' '}
                    {new Date(analysis.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-2xl" role="img" aria-label={analysis.emotion}>
                    {EMOTION_EMOJI[analysis.emotion.toLowerCase()] ?? '😐'}
                  </span>
                  <p className={cn('text-lg font-extrabold', emotionTextClass(analysis.emotion))}>
                    {analysis.emotion.charAt(0).toUpperCase() + analysis.emotion.slice(1)}
                  </p>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-semibold">
                  {(analysis.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
