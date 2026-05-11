import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stethoscope, Mail, MapPin, Calendar, BarChart2,
  Loader2, Save, Edit2, X, RefreshCw, Copy, Users, FileText,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Avatar } from '@/shared/components/Avatar';
import { useToast } from '@/contexts/ToastContext';
import { doctorProfileApi, type UpdateDoctorProfilePayload } from '../service';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  specialty: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(255).optional().or(z.literal('')),
  license_number: z.string().max(100).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none transition-colors';
const labelCls = 'block text-sm font-medium text-neutral-300 mb-1.5';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-green-500',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-black rounded-xl border border-neutral-800 p-4 flex gap-3 items-start">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DoctorProfilePage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [codeCopied, setCodeCopied] = React.useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: doctorProfileApi.getProfile,
    staleTime: 5 * 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['doctor-profile-stats'],
    queryFn: doctorProfileApi.getStats,
    staleTime: 5 * 60_000,
  });

  const { register, handleSubmit, reset, formState: { isDirty, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name ?? '',
      specialty: profile.specialty ?? '',
      location: profile.location ?? '',
      license_number: profile.license_number ?? '',
    });
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDoctorProfilePayload) => doctorProfileApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doctor-profile'] });
      setIsEditing(false);
      addToast({ type: 'success', message: 'Profile updated successfully!' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to update profile.' }),
  });

  const regenerateMutation = useMutation({
    mutationFn: doctorProfileApi.regenerateCode,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doctor-profile'] });
      addToast({ type: 'success', message: 'Doctor code regenerated!' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to regenerate code.' }),
  });

  const onSubmit = (data: FormValues) => {
    const payload: UpdateDoctorProfilePayload = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== '') {
        (payload as Record<string, string>)[k] = v as string;
      }
    }
    updateMutation.mutate(payload);
  };

  const copyCode = async () => {
    if (!profile?.doctor_code) return;
    await navigator.clipboard.writeText(profile.doctor_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Stethoscope className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Doctor Profile</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your professional information</p>
        </div>
      </div>

      {/* Doctor Card */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Avatar name={profile?.name ?? 'Doctor'} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            {profile?.specialty && (
              <p className="text-green-400 text-sm font-medium">{profile.specialty}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-neutral-400">
              {profile?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {profile.email}
                </span>
              )}
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              {profile?.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            icon={isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            onClick={() => { setIsEditing((p) => !p); if (isEditing) reset(); }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doc-name" className={labelCls}>Full Name</label>
                <input id="doc-name" {...register('name')} className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="doc-specialty" className={labelCls}>Specialty</label>
                <input id="doc-specialty" {...register('specialty')} className={inputCls} placeholder="e.g. Psychiatry, Psychology" />
              </div>
              <div>
                <label htmlFor="doc-license" className={labelCls}>License Number</label>
                <input id="doc-license" {...register('license_number')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="doc-location" className={labelCls}>Location</label>
                <input id="doc-location" {...register('location')} className={inputCls} placeholder="City, Country" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={!isDirty || updateMutation.isPending}
                icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Email', value: profile?.email },
              { label: 'Specialty', value: profile?.specialty },
              { label: 'License Number', value: profile?.license_number },
              { label: 'Location', value: profile?.location },
              { label: 'Verification Status', value: profile?.verification_status },
            ].filter(({ value }) => value).map(({ label, value }) => (
              <div key={label} className="p-3 bg-black rounded-xl border border-neutral-800">
                <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                <p className="text-white font-medium capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctor Code */}
      {profile?.doctor_code && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Your Doctor Code</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Share this code with patients so they can connect to you. Each code is unique and 6 characters.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-black rounded-xl border border-neutral-700 px-4 py-2.5">
              <code className="text-2xl font-bold tracking-[0.3em] text-green-400">
                {profile.doctor_code}
              </code>
            </div>
            <Button
              variant="secondary"
              icon={<Copy className="w-4 h-4" />}
              onClick={copyCode}
            >
              {codeCopied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="secondary"
              icon={regenerateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              onClick={() => {
                if (window.confirm('Regenerate your doctor code? Your old code will stop working immediately.')) {
                  regenerateMutation.mutate();
                }
              }}
              disabled={regenerateMutation.isPending}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* Account Statistics */}
      {stats && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Account Statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Total Patients"
              value={stats.total_patients}
              sub="All-time"
              color="text-green-500"
            />
            <StatCard
              icon={Users}
              label="Recent Patients"
              value={stats.recent_patients_count}
              sub="Last 30 days"
              color="text-blue-400"
            />
            <StatCard
              icon={FileText}
              label="Total Forms"
              value={stats.total_forms}
              sub="All-time"
              color="text-purple-400"
            />
            <StatCard
              icon={FileText}
              label="Recent Forms"
              value={stats.recent_forms_count}
              sub="Last 7 days"
              color="text-amber-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
