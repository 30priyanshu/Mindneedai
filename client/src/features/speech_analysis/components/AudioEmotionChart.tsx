import React from 'react';
import { TrendingUp } from 'lucide-react';

interface AudioEmotionChartProps {
  emotionDistribution: Record<string, number>;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#20c26d',
  neutral: '#64748b',
  sad: '#64748b',
  angry: '#64748b',
  fear: '#64748b',
  surprise: '#64748b',
  disgust: '#64748b',
  calm: '#20c26d',
};

export function AudioEmotionChart({ emotionDistribution }: AudioEmotionChartProps): React.ReactElement {
  const sortedEmotions = Object.entries(emotionDistribution)
    .map(([emotion, value]) => ({
      emotion,
      value,
      displayName: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      color: EMOTION_COLORS[emotion.toLowerCase()] ?? '#6b7280',
    }))
    .sort((a, b) => b.value - a.value)
    .filter((item) => item.value > 0.05);

  const topEmotions = sortedEmotions.slice(0, 4);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg flex items-center justify-center shadow-sm">
          <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text">
            Vocal Emotion Patterns
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Key emotional expressions detected</p>
        </div>
      </div>

      <div className="space-y-3">
        {topEmotions.map((item, idx) => (
          <div key={item.emotion} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {item.displayName}
                </span>
                {idx === 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-dark-card text-neutral-700 dark:text-neutral-300 rounded-full border border-neutral-200 dark:border-dark-border">
                    Primary
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-dark-text">
                {(item.value * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-neutral-100 dark:bg-dark-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${item.value * 100}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {sortedEmotions.length > 4 && (
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-dark-border">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Showing top 4 of {sortedEmotions.length} detected emotions
          </p>
        </div>
      )}
    </div>
  );
}
