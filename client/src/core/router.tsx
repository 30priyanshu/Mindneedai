import React, { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/core/types';

export const ROLE_HOME: Readonly<Record<UserRole, string>> = {
  user: '/dashboard',
  doctor: '/doctor/dashboard',
};

function resolveRoleHome(role: UserRole | null): string {
  if (role && role in ROLE_HOME) return ROLE_HOME[role];
  return ROLE_HOME.user;
}

export function ProtectedRoute(): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <></>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute(): React.ReactElement {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <></>;
  if (isAuthenticated) return <Navigate to={resolveRoleHome(role)} replace />;
  return <Outlet />;
}

export function RoleBasedRoute({ allowedRole }: { allowedRole: UserRole }): React.ReactElement {
  const { role } = useAuth();
  if (role !== allowedRole) {
    return <Navigate to={resolveRoleHome(role)} replace />;
  }
  return <Outlet />;
}

export const LandingPage = lazy(() => import('@/features/marketing/pages/LandingPage'));

export const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
export const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));

export const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
export const DoctorDashboardPage = lazy(() => import('@/features/dashboard/pages/DoctorDashboardPage'));

export const TextAnalysisPage = lazy(() => import('@/features/text_analysis/pages/TextAnalysisPage'));
export const AudioAnalysisPage = lazy(() => import('@/features/speech_analysis/pages/AudioAnalysisPage'));
export const VideoAnalysisPage = lazy(() => import('@/features/facial_analysis/pages/VideoAnalysisPage'));

export const MoodTrackerPage = lazy(() => import('@/features/mood/pages/MoodTrackerPage'));
export const HealthMetricsPage = lazy(() => import('@/features/health_metrics/pages/HealthMetricsPage'));

export const AssessmentPage = lazy(() => import('@/features/assessments/pages/AssessmentPage'));
export const AssessmentHistoryPage = lazy(() => import('@/features/assessments/pages/AssessmentHistoryPage'));
export const DoctorPatientAssessmentsPage = lazy(() => import('@/features/assessments/pages/DoctorPatientAssessmentsPage'));

export const MyWellnessFormsPage = lazy(() => import('@/features/wellness_forms/pages/MyWellnessFormsPage'));
export const ViewWellnessFormPage = lazy(() => import('@/features/wellness_forms/pages/ViewWellnessFormPage'));
export const CreateWellnessFormPage = lazy(() => import('@/features/wellness_forms/pages/CreateWellnessFormPage'));
export const EditWellnessFormPage = lazy(() => import('@/features/wellness_forms/pages/EditWellnessFormPage'));

export const ProfilePage = lazy(() => import('@/features/user_profile/pages/ProfilePage'));
export const SettingsPage = lazy(() => import('@/features/user_profile/pages/SettingsPage'));
export const ConnectDoctorPage = lazy(() => import('@/features/user_profile/pages/ConnectDoctorPage'));

export const DoctorProfilePage = lazy(() => import('@/features/doctor_profile/pages/DoctorProfilePage'));
export const DoctorPatientsPage = lazy(() => import('@/features/doctor_profile/pages/DoctorPatientsPage'));

export const HistoryPage = lazy(() => import('@/features/history/pages/HistoryPage'));
export const HelpPage = lazy(() => import('@/features/help/pages/HelpPage'));
