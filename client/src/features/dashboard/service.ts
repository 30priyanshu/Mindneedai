import api from '@/core/api';
import type {
  UserDashboardStats,
  RecentAnalysis,
  DoctorDashboardStats,
  RecentWellnessForm,
} from './types';

export const dashboardApi = {
  getUserDashboardStats: async (): Promise<UserDashboardStats> => {
    const { data } = await api.get<UserDashboardStats>('/users/dashboard/stats');
    return data;
  },

  getUserRecentAnalyses: async (limit = 5): Promise<RecentAnalysis[]> => {
    const { data } = await api.get<RecentAnalysis[]>('/users/dashboard/recent-analyses', {
      params: { limit },
    });
    return data;
  },

  getDoctorDashboardStats: async (): Promise<DoctorDashboardStats> => {
    const { data } = await api.get<DoctorDashboardStats>('/doctors/dashboard/stats');
    return data;
  },

  getDoctorRecentForms: async (limit = 10): Promise<RecentWellnessForm[]> => {
    const { data } = await api.get<RecentWellnessForm[]>('/doctors/dashboard/recent-forms', {
      params: { limit },
    });
    return data;
  },
};
