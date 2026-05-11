import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { doctorProfileApi, type PatientSummary } from '@/features/doctor_profile/service';
import { dashboardApi } from '@/features/dashboard/service';
import type { DoctorDashboardStats, RecentWellnessForm } from '@/features/dashboard/types';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Users, Key, Plus, Loader2, FileText, Calendar, Clock } from 'lucide-react';
import { formatDateWithTime } from '@/utils/dateTimeUtils';

function patientDisplayName(p: PatientSummary): string {
  return p.name?.trim() || p.email || 'Unnamed Patient';
}

export default function DoctorDashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const { doctorCode, name } = useAuth();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DoctorDashboardStats | null>(null);
  const [recentForms, setRecentForms] = useState<RecentWellnessForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingForms, setLoadingForms] = useState(true);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      setLoadingStats(true);
      setLoadingForms(true);
      try {
        const [patientsData, stats, forms] = await Promise.all([
          doctorProfileApi.getPatients(),
          dashboardApi.getDoctorDashboardStats(),
          dashboardApi.getDoctorRecentForms(5),
        ]);
        setPatients(patientsData);
        setDashboardStats(stats);
        setRecentForms(forms);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
        setLoadingStats(false);
        setLoadingForms(false);
      }
    };
    void load();
  }, []);

  const copyCodeToClipboard = (): void => {
    if (!doctorCode) return;
    void navigator.clipboard.writeText(doctorCode);
    setShowCode(true);
    window.setTimeout(() => {
      setShowCode(false);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome, Dr. {name}</h1>
        <p className="text-gray-400">Manage your patients and their mental wellness forms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Patients</p>
              <p className="text-4xl font-bold text-white">
                {loadingStats ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  (dashboardStats?.total_patients ?? patients.length)
                )}
              </p>
            </div>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-black" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Wellness Forms</p>
              <p className="text-4xl font-bold text-white">
                {loadingStats ? <Loader2 className="w-8 h-8 animate-spin" /> : (dashboardStats?.total_forms ?? 0)}
              </p>
            </div>
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-black" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Your Doctor Code</p>
              <p className="text-2xl font-bold text-white tracking-wider">{doctorCode ?? '------'}</p>
            </div>
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <Key className="w-8 h-8 text-black" />
            </div>
          </div>
          <button
            type="button"
            onClick={copyCodeToClipboard}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showCode ? '✓ Copied!' : 'Click to copy'}
          </button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Recent Forms (7d)</p>
              <p className="text-4xl font-bold text-white">
                {loadingStats ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  (dashboardStats?.recent_forms_count ?? 0)
                )}
              </p>
            </div>
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-black" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/doctor/patients')}
          icon={<Users className="w-5 h-5" />}
        >
          View All Patients
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => navigate('/doctor/create-wellness-form')}
          icon={<Plus className="w-5 h-5" />}
        >
          Create New Wellness Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-gray-900 border-2 border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Patients</h2>
            <Button variant="ghost" onClick={() => navigate('/doctor/patients')}>
              View All
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No patients yet</p>
              <p className="text-gray-500 text-sm">
                Share your doctor code{' '}
                <span className="font-bold text-green-400">{doctorCode}</span> with your patients to connect
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.slice(0, 5).map((patient) => (
                <div
                  key={patient.user_id}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{patientDisplayName(patient)}</p>
                    <p className="text-gray-400 text-sm">{patient.email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Connected: {new Date(patient.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate(`/doctor/create-wellness-form?patient=${patient.user_id}`)
                    }
                  >
                    Create Form
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-gray-900 border-2 border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Wellness Forms</h2>
          </div>

          {loadingForms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            </div>
          ) : recentForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No wellness forms yet</p>
              <p className="text-gray-500 text-sm">Create your first wellness form for a patient</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentForms.map((form) => (
                <div
                  key={form.form_id}
                  role="button"
                  tabIndex={0}
                  className="p-4 bg-black/50 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(`/wellness-forms/${form.form_id}`, { state: { from: 'dashboard' } })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/wellness-forms/${form.form_id}`, { state: { from: 'dashboard' } });
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{form.client_name}</p>
                      {form.patient_name && <p className="text-gray-400 text-sm">{form.patient_name}</p>}
                      {form.created_at && (
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateWithTime(form.created_at)}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        form.status === 'submitted'
                          ? 'bg-green-500/20 text-green-400'
                          : form.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {form.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-4 bg-blue-500/10 border-2 border-blue-500">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-blue-400 mb-1">How to connect with patients:</p>
            <p>
              Share your unique doctor code <span className="font-bold text-white">{doctorCode}</span> with your
              patients. They can use this code to connect with you and share their wellness information.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
