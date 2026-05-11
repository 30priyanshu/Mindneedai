import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Save, Trash2, Mail, PhoneCall } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { emergencyContactsApi } from '../service';
import type { EmergencyContact } from '../types';

const schema = z.object({
  doctor_enabled: z.boolean(),
  doctor_email: z.string().email('Invalid email').or(z.literal('')),
  loved_one_enabled: z.boolean(),
  loved_one_email: z.string().email('Invalid email').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function EmergencyContactsSection(): React.ReactElement {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => emergencyContactsApi.getEmergencyContacts(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      doctor_enabled: false,
      doctor_email: '',
      loved_one_enabled: false,
      loved_one_email: '',
    },
  });

  useEffect(() => {
    if (contacts) {
      reset({
        doctor_enabled: contacts.doctor_enabled,
        doctor_email: contacts.doctor_email || '',
        loved_one_enabled: contacts.loved_one_enabled,
        loved_one_email: contacts.loved_one_email || '',
      });
    }
  }, [contacts, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: EmergencyContact) => emergencyContactsApi.saveEmergencyContacts(data),
    onSuccess: (res) => {
      addToast({ type: 'success', message: res.message || 'Emergency contacts saved' });
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to save emergency contacts' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => emergencyContactsApi.deleteEmergencyContacts(),
    onSuccess: (res) => {
      addToast({ type: 'success', message: res.message || 'Emergency contacts removed' });
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      reset({ doctor_enabled: false, doctor_email: '', loved_one_enabled: false, loved_one_email: '' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to delete emergency contacts' });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate({
      doctor_enabled: data.doctor_enabled,
      doctor_email: data.doctor_email || null,
      loved_one_enabled: data.loved_one_enabled,
      loved_one_email: data.loved_one_email || null,
    });
  };

  const doctorEnabled = watch('doctor_enabled');
  const lovedOneEnabled = watch('loved_one_enabled');

  if (isLoading) {
    return (
      <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800 animate-pulse h-48"></div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4 text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <h2 className="font-semibold text-white">Emergency Contacts</h2>
          <p className="text-xs text-neutral-400 leading-snug">
            Configure who should be notified if the system detects an emergency condition in your mental wellness analysis.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Doctor Info */}
          <div className="space-y-4 p-4 rounded-xl border border-neutral-800 bg-black/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <PhoneCall className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-sm">Primary Doctor</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('doctor_enabled')}
                  className="rounded bg-neutral-800 border-neutral-700 text-green-500 focus:ring-green-500"
                />
                <span className="text-xs text-neutral-400">Enable</span>
              </label>
            </div>
            {doctorEnabled && (
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    placeholder="doctor@example.com"
                    {...register('doctor_email')}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none"
                  />
                </div>
                {errors.doctor_email && (
                  <p className="mt-1 text-xs text-red-400">{errors.doctor_email.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Loved One Info */}
          <div className="space-y-4 p-4 rounded-xl border border-neutral-800 bg-black/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <PhoneCall className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">Trusted Loved One</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('loved_one_enabled')}
                  className="rounded bg-neutral-800 border-neutral-700 text-green-500 focus:ring-green-500"
                />
                <span className="text-xs text-neutral-400">Enable</span>
              </label>
            </div>
            {lovedOneEnabled && (
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    placeholder="lovedone@example.com"
                    {...register('loved_one_email')}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none"
                  />
                </div>
                {errors.loved_one_email && (
                  <p className="mt-1 text-xs text-red-400">{errors.loved_one_email.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={saveMutation.isPending || (!doctorEnabled && !lovedOneEnabled)}
            icon={<Save className="w-4 h-4" />}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Contacts'}
          </Button>
          {contacts?.created_at && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (window.confirm('Remove all emergency contacts?')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
            >
              <span className="text-red-500">Remove All</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
