import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/features/dashboard/service';
import { moodApi } from '@/features/mood/services/moodService';
import type { RecentAnalysis } from '@/features/dashboard/types';
import type { WeeklyMoodData } from '@/features/mood/types';
import { HealthMetricsWidget } from '@/features/health_metrics/components/HealthMetricsWidget';
import { DashboardStatsGrid } from '@/features/dashboard/components/DashboardStatsGrid';
import { DashboardWeeklyMoodLink } from '@/features/dashboard/components/DashboardWeeklyMoodLink';
import { DashboardQuickActions } from '@/features/dashboard/components/DashboardQuickActions';
import { DashboardRecentAnalyses } from '@/features/dashboard/components/DashboardRecentAnalyses';
import { DashboardWellnessTip } from '@/features/dashboard/components/DashboardWellnessTip';

function averageFromWeekly(data: WeeklyMoodData): number | null {
  const scores = data.entries
    .filter((e): e is NonNullable<typeof e> => e != null)
    .map((e) => e.score);
  if (scores.length === 0) return null;
  return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage(): React.ReactElement {
  const { userId } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0 });
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMoodData | null>(null);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);

  const loadDashboardData = useCallback(async (): Promise<void> => {
    if (!userId) return;

    setLoading(true);
    setLoadingAnalyses(true);
    let statsMood: number | null = null;

    try {
      const [dashboardStats, analyses] = await Promise.all([
        dashboardApi.getUserDashboardStats(),
        dashboardApi.getUserRecentAnalyses(5),
      ]);

      statsMood = dashboardStats.weekly_avg_mood;
      setStats({
        total: dashboardStats.total_analyses,
        thisWeek: dashboardStats.this_week_count,
        streak: dashboardStats.streak_days,
      });
      setAvgMood(statsMood);
      setRecentAnalyses(analyses);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setLoadingAnalyses(false);
    }

    moodApi
      .getWeekly(0)
      .then((data) => {
        setWeeklyMood(data);
        if (statsMood !== null) {
          setAvgMood(statsMood);
        } else {
          setAvgMood(averageFromWeekly(data));
        }
      })
      .catch(() => {
        /* mood is optional */
      });
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void loadDashboardData();
    }
  }, [userId, loadDashboardData]);

  return (
    <div className="space-y-8">
      <div className="animate-fadeIn">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-dark-text mb-3 leading-comfortable">
          {getGreeting()}
        </h1>
        <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Track your emotional wellness journey and find balance every day
        </p>
      </div>

      <DashboardStatsGrid loading={loading} stats={stats} />
      <DashboardWeeklyMoodLink weeklyMood={weeklyMood} avgMood={avgMood} />
      <HealthMetricsWidget />
      <DashboardQuickActions />
      <DashboardRecentAnalyses loadingAnalyses={loadingAnalyses} analyses={recentAnalyses} />
      <DashboardWellnessTip />
    </div>
  );
}
