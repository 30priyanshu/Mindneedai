import React from 'react';
import { getColorForScore, formatMoodDate } from '@/utils/moodUtils';
import type { MoodEntry } from '@/features/mood/types';

interface MoodCalendarProps {
  monthDate: Date;
  entriesByDate: Record<string, MoodEntry>;
  onSelectDate?: (dateIso: string) => void;
}

export function MoodCalendar({
  monthDate,
  entriesByDate,
  onSelectDate,
}: MoodCalendarProps): React.ReactElement {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const iso = formatMoodDate(d);
        const entry = entriesByDate[iso];
        const bg = entry ? getColorForScore(entry.score) : 'transparent';
        const inMonth = d.getMonth() === monthDate.getMonth();
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelectDate?.(iso)}
            className={`h-10 rounded-md border ${
              inMonth ? 'border-neutral-300 dark:border-dark-border' : 'border-transparent opacity-40'
            }`}
            style={{ backgroundColor: entry ? bg : 'transparent' }}
            aria-label={`Day ${iso}${entry ? `, score ${entry.score}` : ''}`}
          />
        );
      })}
    </div>
  );
}
