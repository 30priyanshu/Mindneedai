import { useCallback } from 'react';
import type { MentalWellnessFormData } from './mentalWellnessForm.types';

type TopLevelTextKey = 'clientName' | 'date';

const isTopLevelText = (section: keyof MentalWellnessFormData | TopLevelTextKey): section is TopLevelTextKey =>
  section === 'clientName' || section === 'date';

/** Single responsibility: immutable updates for mental wellness checkbox + text fields. */
export const useMentalWellnessFieldHandlers = (
  data: MentalWellnessFormData,
  mode: 'view' | 'edit',
  onChange?: (data: MentalWellnessFormData) => void,
) => {
  const handleCheckboxChange = useCallback(
    (section: keyof MentalWellnessFormData, field: string, value: string, isSingleSelect = false) => {
      if (mode !== 'edit' || !onChange) return;
      const next = structuredClone(data);
      if (isTopLevelText(section)) return;

      const block = next[section] as Record<string, string | string[] | unknown>;
      const current = block[field];

      if (isSingleSelect || field === 'option') {
        block[field] = current === value ? '' : value;
        onChange(next);
        return;
      }

      if (!Array.isArray(current)) return;
      const arr = [...current];
      const i = arr.indexOf(value);
      if (i > -1) arr.splice(i, 1);
      else arr.push(value);
      block[field] = arr;
      onChange(next);
    },
    [data, mode, onChange],
  );

  const handleTextChange = useCallback(
    (section: keyof MentalWellnessFormData | TopLevelTextKey, field: string, value: string) => {
      if (mode !== 'edit' || !onChange) return;
      const next = structuredClone(data);
      if (section === 'clientName' || section === 'date') {
        next[section] = value;
        onChange(next);
        return;
      }
      const block = next[section] as Record<string, unknown>;
      block[field] = value;
      onChange(next);
    },
    [data, mode, onChange],
  );

  return { handleCheckboxChange, handleTextChange };
};
