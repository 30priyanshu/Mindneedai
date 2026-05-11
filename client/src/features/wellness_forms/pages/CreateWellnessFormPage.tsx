import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { wellnessFormApi } from '../service';
import { MentalWellnessForm } from '../components/MentalWellnessForm';
import { WellnessFormWithToggle } from '../components/WellnessFormWithToggle';
import type { MentalWellnessFormData } from '../components/mentalWellnessForm.types';
import {
  createEmptyMentalWellnessFormData,
  mapMentalWellnessToBackend,
} from '@/utils/wellnessFormMapper';
import { doctorProfileApi } from '@/features/doctor_profile/service';
import type { PatientSummary } from '@/features/doctor_profile/types';

const patientDisplayName = (p: PatientSummary): string =>
  p.name?.trim() || p.email || 'Unnamed Patient';

const patientClientName = (p: PatientSummary): string =>
  p.name?.trim() || '';

export default function CreateWellnessFormPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState<MentalWellnessFormData>(createEmptyMentalWellnessFormData());
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);

  // Load doctor's patients
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: () => doctorProfileApi.getPatients(),
    staleTime: 60_000,
  });

  // Pre-select patient from query param
  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId && patients.length > 0) {
      setSelectedPatientId(patientId);
      const patient = patients.find((p: PatientSummary) => p.user_id === patientId);
      if (patient) {
        setFormData((prev) => ({ ...prev, clientName: patientClientName(patient) }));
      }
    }
  }, [searchParams, patients]);

  const createMutation = useMutation({
    mutationFn: () =>
      wellnessFormApi.create({
        user_id: selectedPatientId,
        client_name: formData.clientName,
        form_date: formData.date,
        form_data: mapMentalWellnessToBackend(formData),
        status: 'submitted',
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['wellness-forms'] });
      addToast({ type: 'success', message: 'Mental Wellness Form created! AI insights are generating…' });
      setCreatedFormId(res.form_id);
      void qc.setQueryData(['wellness-forms', res.form_id], res);
    },
    onError: () => addToast({ type: 'error', message: 'Failed to create wellness form. Please try again.' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      addToast({ type: 'error', message: 'Please select a patient' });
      return;
    }
    if (!formData.clientName.trim()) {
      addToast({ type: 'error', message: 'Please enter a client name' });
      return;
    }
    createMutation.mutate();
  };

  // After creation, show toggle view (form + AI insights)
  if (createdFormId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/wellness-forms"
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to forms
          </Link>
          <Button variant="secondary" onClick={() => navigate('/doctor/create-wellness-form')}>
            Create Another
          </Button>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 print:hidden">
          <p className="text-sm font-medium text-green-400">
            ✓ Form created successfully
          </p>
          <p className="text-xs text-green-400/70 mt-0.5">
            AI insights are being generated in the background. Check the AI Insights tab shortly.
          </p>
        </div>

        <WellnessFormWithToggle
          formData={formData}
          formMode="view"
          formId={createdFormId}
          userRole="doctor"
          defaultView="insights"
        />
      </div>
    );
  }

  if (loadingPatients) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link
          to="/wellness-forms"
          className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          aria-label="Back to wellness forms"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Create Wellness Form</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Fill out a mental status exam for a patient</p>
        </div>
      </div>

      {/* Patient selector */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 print:hidden">
        <label htmlFor="cwf-patient" className="block text-sm font-medium text-neutral-300 mb-2">
          Select Patient <span className="text-red-400">*</span>
        </label>
        {patients.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No connected patients found. A patient must connect to you using your doctor code first.
          </p>
        ) : (
          <select
            id="cwf-patient"
            value={selectedPatientId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedPatientId(e.target.value);
              const patient = patients.find((p: PatientSummary) => p.user_id === e.target.value);
              if (patient) setFormData((prev) => ({ ...prev, clientName: patientClientName(patient) }));
            }}
            disabled={createMutation.isPending}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Choose a patient…</option>
            {patients.map((p: PatientSummary) => (
              <option key={p.user_id} value={p.user_id}>
                {patientDisplayName(p)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* MSE form */}
      <MentalWellnessForm data={formData} mode="edit" onChange={setFormData} />

      {/* Actions */}
      <div className="flex gap-3 justify-end print:hidden">
        <Button type="button" variant="secondary" onClick={() => navigate('/wellness-forms')}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={createMutation.isPending || !selectedPatientId}
        >
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Create Wellness Form
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
