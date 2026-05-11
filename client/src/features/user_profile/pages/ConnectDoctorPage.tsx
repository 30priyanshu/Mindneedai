import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { userProfileApi } from '../service';

export default function ConnectDoctorPage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'email' | 'code'>('email');

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', 'doctor'],
    queryFn: userProfileApi.getConnectedDoctor,
    staleTime: 60_000,
  });

  const connectMutation = useMutation({
    mutationFn: () => userProfileApi.connectDoctor(input, mode === 'code'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-profile'] });
      setInput('');
      addToast({ type: 'success', message: 'Successfully connected to your doctor!' });
    },
    onError: () => addToast({ type: 'error', message: 'Could not connect. Check the email/code and try again.' }),
  });

  const disconnectMutation = useMutation({
    mutationFn: userProfileApi.disconnectDoctor,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-profile'] });
      addToast({ type: 'info', message: 'Disconnected from your doctor.' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Connect with a Doctor</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Link your account to receive personalized care</p>
        </div>
      </div>

      {data?.connected && data.doctor ? (
        <div className="bg-neutral-900 rounded-2xl border border-green-500/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-white">Connected</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-black rounded-xl border border-neutral-800">
              <p className="text-neutral-400">Doctor</p>
              <p className="font-medium text-white mt-0.5">{data.doctor.name}</p>
            </div>
            <div className="p-3 bg-black rounded-xl border border-neutral-800">
              <p className="text-neutral-400">Email</p>
              <p className="font-medium text-white mt-0.5">{data.doctor.email}</p>
            </div>
            {data.doctor.specialty && (
              <div className="p-3 bg-black rounded-xl border border-neutral-800">
                <p className="text-neutral-400">Specialty</p>
                <p className="font-medium text-white mt-0.5">{data.doctor.specialty}</p>
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            icon={<XCircle className="w-4 h-4" />}
          >
            {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect from Doctor'}
          </Button>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
          <p className="text-sm text-neutral-400">
            Connect by entering your doctor's email address or their unique clinic code.
          </p>

          <div className="flex gap-2">
            {(['email', 'code'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                  mode === m
                    ? 'bg-green-500 text-black border-green-500'
                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {m === 'email' ? 'Doctor Email' : 'Clinic Code'}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type={mode === 'email' ? 'email' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'email' ? 'doctor@example.com' : 'Enter clinic code…'}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-800 bg-black text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none"
            />
            <Button
              variant="primary"
              onClick={() => connectMutation.mutate()}
              disabled={!input.trim() || connectMutation.isPending}
            >
              {connectMutation.isPending ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
