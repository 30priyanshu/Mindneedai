import React from 'react';
import { Smile, Frown, Meh, AlertTriangle, Sparkles, Zap, Activity, TrendingUp, Video, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface VideoEmotionHeroProps {
  dominantEmotion: string;
  averageConfidence: number;
  totalFrames: number;
  overallSentiment?: string;
  emotionalStability?: number;
}

type EmotionStyle = { primary: string; bg: string; border: string; icon: LucideIcon };

const EMOTION_COLORS: Record<string, EmotionStyle> = {
  happiness: { primary: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: Smile },
  sadness: { primary: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE', icon: Frown },
  anger: { primary: '#DC2626', bg: '#FEE2E2', border: '#FECACA', icon: AlertTriangle },
  surprise: { primary: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', icon: Sparkles },
  fear: { primary: '#9333EA', bg: '#F3E8FF', border: '#E9D5FF', icon: Zap },
  disgust: { primary: '#059669', bg: '#D1FAE5', border: '#A7F3D0', icon: Meh },
  neutral: { primary: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', icon: Meh },
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Very High';
  if (confidence >= 0.6) return 'High';
  if (confidence >= 0.4) return 'Moderate';
  return 'Low';
}

export function VideoEmotionHero({
  dominantEmotion,
  averageConfidence,
  totalFrames,
  overallSentiment,
  emotionalStability,
}: VideoEmotionHeroProps): React.ReactElement {
  const emotionKey = dominantEmotion.toLowerCase();
  const colors = EMOTION_COLORS[emotionKey] ?? EMOTION_COLORS.neutral;
  const Icon = colors.icon;
  const confLabel = confidenceLabel(averageConfidence);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-6 animate-slideUp">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              PRIMARY EMOTION ANALYSIS
            </p>
            <h2 className="text-3xl font-bold text-primary capitalize mb-1">{dominantEmotion}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Detected with {confLabel.toLowerCase()} confidence
            </p>
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Confidence Level</div>
          <div className="text-xl font-bold text-primary">{(averageConfidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Total Frames
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
            {totalFrames.toLocaleString()}
          </div>
        </div>

        {emotionalStability !== undefined ? (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Emotional Consistency
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {(emotionalStability * 100).toFixed(0)}%
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Analysis Quality
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {(averageConfidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {overallSentiment ? (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Overall Sentiment
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text capitalize">
              {overallSentiment}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Frame Rate
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {totalFrames > 0 ? (totalFrames / 10).toFixed(1) : '0'} fps
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
