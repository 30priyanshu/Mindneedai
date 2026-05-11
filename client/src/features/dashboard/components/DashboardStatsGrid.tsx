import React from 'react';
import { Activity, TrendingUp, Loader2 } from 'lucide-react';

export interface DashboardStatSnapshot {
  total: number;
  thisWeek: number;
  streak: number;
}

interface Props {
  loading: boolean;
  stats: DashboardStatSnapshot;
}

export function DashboardStatsGrid({ loading, stats }: Props): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="card-elevated hover:shadow-xl transition-all duration-200 hover:scale-[1.01] cursor-default animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-primary" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-text mb-2">
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.total}
        </h3>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-medium">Total Analyses</p>
        {stats.total > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
            You&apos;re making great progress!
          </p>
        )}
      </div>

      <div className="card-elevated hover:shadow-xl transition-all duration-200 hover:scale-[1.01] cursor-default animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-primary" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            This Week
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-text mb-2">
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.thisWeek}
        </h3>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-medium">Recent Activity</p>
        {stats.thisWeek > 0 && (
          <p className="text-xs text-primary dark:text-primary-light mt-3 font-medium">Staying consistent!</p>
        )}
      </div>

      <div className="card-elevated hover:shadow-xl transition-all duration-200 hover:scale-[1.01] cursor-default animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-primary" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Streak
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-text mb-2">
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`
          )}
        </h3>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-medium">Daily Streak</p>
        {stats.streak >= 3 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">On fire! Keep it up!</p>
        )}
        {stats.streak === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">Start your streak today!</p>
        )}
      </div>
    </div>
  );
}
