import React from 'react';
import { cn } from '@/utils/cn';
import { getColorForScore } from '@/utils/moodUtils';

interface Props {
  date: string;
  score?: number | null;
  isToday?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const DayIndicator: React.FC<Props> = ({ date, score, isToday, selected, onClick }) => {
  const d = new Date(date + 'T12:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.slice(8, 10);
  const color = getColorForScore(score ?? null);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${dayName} ${dayNum}${score != null ? `, mood score ${score}` : ', no mood recorded'}`}
      className={cn(
        'group flex flex-col items-center min-w-[44px] rounded-lg p-1 focus:outline-none',
        onClick ? 'cursor-pointer' : 'cursor-default',
        selected && 'ring-2 ring-green-500 ring-offset-2 ring-offset-neutral-900 rounded-lg'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform',
          'group-focus-visible:ring-2 group-focus-visible:ring-green-500',
          isToday ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-neutral-900' : '',
          score != null ? 'border-transparent' : 'border-neutral-700'
        )}
        style={{ backgroundColor: score != null ? color : 'transparent' }}
      >
        <span className={cn('text-sm font-semibold', score != null ? 'text-black' : 'text-neutral-500')}>
          {score ?? ''}
        </span>
      </div>
      <div className="text-center mt-1">
        <div className="text-xs text-neutral-400 font-medium">{dayName}</div>
        <div className="text-[10px] text-neutral-500">{dayNum}</div>
      </div>
    </button>
  );
};
