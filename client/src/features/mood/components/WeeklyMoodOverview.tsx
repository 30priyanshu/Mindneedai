import React from 'react';
import { DayIndicator } from './DayIndicator';
import { getWeekDates } from '@/utils/moodUtils';
import type { MoodEntry } from '../types';

interface Props {
  weekOffset: number;
  entries: (MoodEntry | null)[];
  selectedDate?: string;
  onDayClick?: (isoDate: string) => void;
}

export const WeeklyMoodOverview: React.FC<Props> = ({ weekOffset, entries, selectedDate, onDayClick }) => {
  const dates = getWeekDates(weekOffset);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {dates.map((d, i) => (
        <DayIndicator
          key={d}
          date={d}
          isToday={d === today}
          score={entries[i]?.score ?? null}
          selected={selectedDate === d}
          {...(onDayClick ? { onClick: () => onDayClick(d) } : {})}
        />
      ))}
    </div>
  );
};
