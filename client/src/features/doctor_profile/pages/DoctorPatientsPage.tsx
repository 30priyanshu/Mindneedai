import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, UserX } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { doctorProfileApi } from '../service';

export default function DoctorPatientsPage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['doctor-profile', 'patients'],
    queryFn: () => doctorProfileApi.getPatients(),
    staleTime: 60_000,
  });

  const disconnectMutation = useMutation({
    mutationFn: doctorProfileApi.disconnectPatient,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doctor-profile', 'patients'] });
      addToast({ type: 'info', message: 'Patient disconnected.' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to disconnect patient.' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Patients</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Patients connected to your practice</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No patients connected yet</p>
          <p className="text-sm text-neutral-500 mt-1">Share your clinic code with patients to connect</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.user_id}
              className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="font-medium text-white">
                  {patient.name ?? patient.email}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{patient.email}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Connected: {new Date(patient.connected_at).toLocaleDateString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => disconnectMutation.mutate(patient.user_id)}
                disabled={disconnectMutation.isPending}
                aria-label={`Disconnect ${patient.email}`}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
