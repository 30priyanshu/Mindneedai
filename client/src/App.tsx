import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppLayout } from '@/layout/AppLayout';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ToastContainer } from '@/shared/components/Toast';
import {
  ProtectedRoute,
  PublicRoute,
  RoleBasedRoute,
  ROLE_HOME,
  LandingPage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  DoctorDashboardPage,
  TextAnalysisPage,
  AudioAnalysisPage,
  VideoAnalysisPage,
  MoodTrackerPage,
  HealthMetricsPage,
  AssessmentPage,
  AssessmentHistoryPage,
  DoctorPatientAssessmentsPage,
  MyWellnessFormsPage,
  ViewWellnessFormPage,
  CreateWellnessFormPage,
  EditWellnessFormPage,
  ProfilePage,
  SettingsPage,
  ConnectDoctorPage,
  DoctorProfilePage,
  DoctorPatientsPage,
  HistoryPage,
  HelpPage,
} from '@/core/router';
import type { UserRole } from '@/core/types';

function AuthenticatedFallback(): React.ReactElement {
  const { role } = useAuth();
  return <Navigate to={ROLE_HOME[role as UserRole] ?? ROLE_HOME.user} replace />;
}

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <SidebarProvider>
            <NotificationProvider>
              <ToastProvider>
                <Router>
                  <ToastContainer />
                  <Suspense fallback={<LoadingSpinner fullPage />}>
                    <Routes>
                      <Route element={<PublicRoute />}>
                        <Route path="/" element={<LandingPage />} />
                      </Route>

                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="help" element={<HelpPage />} />
                          <Route path="wellness-forms" element={<MyWellnessFormsPage />} />
                          <Route path="wellness-forms/:formId" element={<ViewWellnessFormPage />} />

                          <Route element={<RoleBasedRoute allowedRole="user" />}>
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="mood" element={<MoodTrackerPage />} />
                            <Route path="health" element={<HealthMetricsPage />} />
                            <Route path="history" element={<HistoryPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="connect-doctor" element={<ConnectDoctorPage />} />
                            <Route path="assessments" element={<AssessmentPage />} />
                            <Route path="assessments/history" element={<AssessmentHistoryPage />} />
                            <Route path="analyze">
                              <Route path="text" element={<TextAnalysisPage />} />
                              <Route path="video" element={<VideoAnalysisPage />} />
                              <Route path="audio" element={<AudioAnalysisPage />} />
                            </Route>
                          </Route>

                          <Route element={<RoleBasedRoute allowedRole="doctor" />}>
                            <Route path="doctor/dashboard" element={<DoctorDashboardPage />} />
                            <Route path="doctor/patients" element={<DoctorPatientsPage />} />
                            <Route path="doctor/patient-assessments" element={<DoctorPatientAssessmentsPage />} />
                            <Route path="doctor/profile" element={<DoctorProfilePage />} />
                            <Route path="doctor/create-wellness-form" element={<CreateWellnessFormPage />} />
                            <Route path="doctor/edit-wellness-form/:formId" element={<EditWellnessFormPage />} />
                          </Route>

                          <Route path="*" element={<AuthenticatedFallback />} />
                        </Route>
                      </Route>
                    </Routes>
                  </Suspense>
                </Router>
              </ToastProvider>
            </NotificationProvider>
          </SidebarProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
