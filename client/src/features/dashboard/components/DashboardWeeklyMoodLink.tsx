import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getColorForScore } from '@/utils/moodUtils';
import type { WeeklyMoodData } from '@/features/mood/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface Props {
  weeklyMood: WeeklyMoodData | null;
  avgMood: number | null;
}

export function DashboardWeeklyMoodLink({ weeklyMood, avgMood }: Props): React.ReactElement {
  return (
    <Link to="/mood" className="card-elevated hover:shadow-xl transition-all duration-200 hover:scale-[1.01] animate-fadeIn block">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-dark-text">Weekly Mood Overview</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Track your daily emotional wellness</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Weekly Average</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-dark-text">{avgMood ?? '—'}</p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="grid grid-cols-7 gap-3 w-full">
          {DAY_LABELS.map((day, i) => {
            const score = weeklyMood?.entries[i]?.score ?? null;
            const bg = score ? getColorForScore(score) : 'transparent';
            const border = score ? 'border-transparent' : 'border-neutral-300 dark:border-dark-border';
            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <div
                  className={cn('w-10 h-10 rounded-full border-2 mx-auto', border)}
                  style={{ backgroundColor: bg }}
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium text-center">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-primary hover:text-primary-dark transition-colors ml-4 flex-shrink-0">
          <ArrowRight size={20} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}
