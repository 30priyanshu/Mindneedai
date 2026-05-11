import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { wellnessFormApi } from '../service';
import { MentalWellnessForm } from '../components/MentalWellnessForm';
import type { MentalWellnessFormData } from '../components/mentalWellnessForm.types';
import {
  createEmptyMentalWellnessFormData,
  mapMentalWellnessToBackend,
  isMentalWellnessFormShape,
  mapBackendToMentalWellnessFormData,
} from '@/utils/wellnessFormMapper';

export default function EditWellnessFormPage(): React.ReactElement {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [formData, setFormData] = useState<MentalWellnessFormData>(createEmptyMentalWellnessFormData());
  const [initialized, setInitialized] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ['wellness-forms', formId],
    queryFn: () => wellnessFormApi.getById(formId!),
    enabled: !!formId,
  });

  // Hydrate the MSE form with existing data
  useEffect(() => {
    if (!form || initialized) return;
    const raw = form.form_data as Record<string, unknown>;
    if (isMentalWellnessFormShape(raw)) {
      setFormData(mapBackendToMentalWellnessFormData(raw, form.client_name, form.form_date));
    } else {
      setFormData({
        ...createEmptyMentalWellnessFormData(),
        clientName: form.client_name,
        date: form.form_date,
      });
    }
    setInitialized(true);
  }, [form, initialized]);

  const updateMutation = useMutation({
    mutationFn: () =>
      wellnessFormApi.update(formId!, {
        client_name: formData.clientName,
        form_date: formData.date,
        form_data: mapMentalWellnessToBackend(formData),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wellness-forms'] });
      addToast({ type: 'success', message: 'Form updated successfully!' });
      navigate(`/wellness-forms/${formId!}`);
    },
    onError: () => addToast({ type: 'error', message: 'Failed to update form.' }),
  });

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-400">Form not found.</p>
        <Link to="/wellness-forms" className="text-green-500 hover:text-green-400 text-sm mt-2 inline-block">
          ← Back to forms
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link
          to={`/wellness-forms/${formId!}`}
          className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          aria-label="Back to form"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Wellness Form</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Update the mental status exam for {form.client_name}</p>
        </div>
      </div>

      {/* MSE form in edit mode */}
      <MentalWellnessForm data={formData} mode="edit" onChange={setFormData} />

      {/* Actions */}
      <div className="flex gap-3 justify-end print:hidden">
        <Button type="button" variant="secondary" onClick={() => navigate(`/wellness-forms/${formId!}`)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
