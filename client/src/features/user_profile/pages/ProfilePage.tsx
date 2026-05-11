import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, MapPin, Calendar, BarChart2,
  Loader2, Save, Edit2, X, Shield,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Avatar } from '@/shared/components/Avatar';
import { useToast } from '@/contexts/ToastContext';
import { userProfileApi, type UpdateProfilePayload } from '../service';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
] as const;

const schema = z.object({
  name: z.string().max(255).optional().or(z.literal('')),
  first_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  location: z.string().max(255).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  emergency_contact_name: z.string().max(200).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(20).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none transition-colors';
const labelCls = 'block text-sm font-medium text-neutral-300 mb-1.5';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black rounded-xl border border-neutral-800 p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white capitalize">{value}</p>
    </div>
  );
}

export default function ProfilePage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userProfileApi.getProfile,
    staleTime: 5 * 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-profile-stats'],
    queryFn: userProfileApi.getStats,
    staleTime: 5 * 60_000,
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name ?? '',
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      date_of_birth: profile.date_of_birth ?? '',
      gender: profile.gender ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_phone: profile.emergency_contact_phone ?? '',
    });
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userProfileApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-profile'] });
      void qc.invalidateQueries({ queryKey: ['user-profile-stats'] });
      setIsEditing(false);
      addToast({ type: 'success', message: 'Profile updated successfully!' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to update profile.' }),
  });

  const onSubmit = (data: FormValues) => {
    const payload: UpdateProfilePayload = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== '') {
        (payload as Record<string, string>)[k] = v as string;
      }
    }
    updateMutation.mutate(payload);
  };

  const displayName =
    profile?.name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Your Profile';

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
        <User className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Profile</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your personal information</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Avatar name={displayName} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
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
            variant={isEditing ? 'secondary' : 'secondary'}
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
                <label htmlFor="prof-name" className={labelCls}>Display Name</label>
                <input id="prof-name" {...register('name')} className={inputCls} placeholder="Full name displayed across the app" />
              </div>
              <div>
                <label htmlFor="prof-location" className={labelCls}>Location</label>
                <input id="prof-location" {...register('location')} className={inputCls} placeholder="City, Country" />
              </div>
              <div>
                <label htmlFor="prof-first-name" className={labelCls}>First Name</label>
                <input id="prof-first-name" {...register('first_name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="prof-last-name" className={labelCls}>Last Name</label>
                <input id="prof-last-name" {...register('last_name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="prof-phone" className={labelCls}>Phone</label>
                <input id="prof-phone" type="tel" {...register('phone')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="prof-dob" className={labelCls}>Date of Birth</label>
                <input id="prof-dob" type="date" {...register('date_of_birth')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="prof-gender" className={labelCls}>Gender</label>
                <select id="prof-gender" {...register('gender')} className={inputCls}>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prof-ec-name" className={labelCls}>Emergency Contact Name</label>
                <input id="prof-ec-name" {...register('emergency_contact_name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="prof-ec-phone" className={labelCls}>Emergency Contact Phone</label>
                <input id="prof-ec-phone" type="tel" {...register('emergency_contact_phone')} className={inputCls} />
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
              { label: 'Display Name', value: profile?.name },
              { label: 'First Name', value: profile?.first_name },
              { label: 'Last Name', value: profile?.last_name },
              { label: 'Phone', value: profile?.phone },
              { label: 'Location', value: profile?.location },
              { label: 'Date of Birth', value: profile?.date_of_birth },
              { label: 'Gender', value: profile?.gender },
              { label: 'Emergency Contact', value: profile?.emergency_contact_name },
              { label: 'Emergency Phone', value: profile?.emergency_contact_phone },
            ].filter(({ value }) => value).map(({ label, value }) => (
              <div key={label} className="p-3 bg-black rounded-xl border border-neutral-800">
                <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                <p className="text-white font-medium capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Statistics */}
      {stats && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Account Statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Analyses" value={stats.total_analyses} />
            <StatCard label="Most Frequent Emotion" value={stats.most_frequent_emotion} />
            <StatCard label="Text Analyses" value={stats.text_count} />
            <StatCard label="Video Analyses" value={stats.video_count} />
            <StatCard label="Audio Analyses" value={stats.audio_count} />
          </div>
        </div>
      )}

      {/* Privacy & Consent */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-white">Privacy &amp; Consent</h2>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          Your data is stored securely on our servers. We respect your privacy and do not share any personal information with third parties.
        </p>
        <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
          <p className="text-xs text-neutral-300">
            <strong className="text-white">Data Storage:</strong> All analysis results and personal information are stored securely.
            You can clear your analysis history at any time from the Settings page.
          </p>
        </div>
      </div>
    </div>
  );
}
