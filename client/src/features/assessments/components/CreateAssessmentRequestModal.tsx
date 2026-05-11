import React, { useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { assessmentApi } from '../service';
import type { AssessmentType, DoctorPatientOption } from '../types';

export interface CreateAssessmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, patient is fixed (e.g. quick action from a patient row). */
  patientId?: string;
  patientName?: string;
  /** When no `patientId`, doctor picks from this list inside the modal. */
  patientOptions?: DoctorPatientOption[];
  onSuccess?: () => void;
}

/** Single responsibility: doctor workflow to create a patient assessment request. */
export const CreateAssessmentRequestModal: React.FC<CreateAssessmentRequestModalProps> = ({
  isOpen,
  onClose,
  patientId: fixedPatientId,
  patientName,
  patientOptions,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('PHQ9');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickedPatient, setPickedPatient] = useState('');

  const resetAndClose = () => {
    setAssessmentType('PHQ9');
    setNotes('');
    setPickedPatient('');
    onClose();
  };

  const effectivePatientId = fixedPatientId || pickedPatient;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectivePatientId) {
      addToast({ type: 'warning', message: 'Please select a patient.' });
      return;
    }
    setLoading(true);
    try {
      await assessmentApi.createRequest(effectivePatientId, [assessmentType], notes.trim() || undefined);
      addToast({ type: 'success', message: 'Assessment request sent to patient!' });
      onSuccess?.();
      resetAndClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to create assessment request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Request Assessment"
      description={
        patientName
          ? `Request assessment from ${patientName}`
          : 'Select a patient and assessment type to send a request'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={resetAndClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="create-assessment-request-form" variant="primary" loading={loading}>
            Send Request
          </Button>
        </div>
      }
    >
      <form id="create-assessment-request-form" onSubmit={(ev) => void handleSubmit(ev)} className="space-y-4">
        {!fixedPatientId && patientOptions && patientOptions.length > 0 && (
          <div>
            <label htmlFor="car-patient" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Patient
            </label>
            <select
              id="car-patient"
              value={pickedPatient}
              onChange={(e) => setPickedPatient(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2"
            >
              <option value="">Select patient…</option>
              {patientOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="car-type" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Assessment Type
          </label>
          <select
            id="car-type"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
            className="w-full rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2"
          >
            <option value="PHQ9">PHQ-9 (Depression)</option>
            <option value="GAD7">GAD-7 (Anxiety)</option>
          </select>
        </div>
        <div>
          <label htmlFor="car-notes" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="car-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2"
          />
        </div>
      </form>
    </Modal>
  );
};
