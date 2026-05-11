import React from 'react';
import type { MentalWellnessFormData } from './mentalWellnessForm.types';

export interface MentalWellnessCheckboxGroupProps {
  options: string[];
  selectedValues: string[];
  section: keyof MentalWellnessFormData;
  field: string;
  namePrefix: string;
  isSingleSelect?: boolean;
  mode: 'view' | 'edit';
  onToggle: (
    section: keyof MentalWellnessFormData,
    field: string,
    value: string,
    isSingleSelect: boolean,
  ) => void;
}

/** Single responsibility: one checkbox cluster inside the mental wellness form. */
export const MentalWellnessCheckboxGroup: React.FC<MentalWellnessCheckboxGroupProps> = ({
  options,
  selectedValues,
  section,
  field,
  namePrefix,
  isSingleSelect = false,
  mode,
  onToggle,
}) => (
  <>
    {options.map((option) => (
      <div key={option} className="checkbox-group">
        <input
          type="checkbox"
          id={`${namePrefix}-${option}`}
          checked={isSingleSelect ? selectedValues[0] === option : selectedValues.includes(option)}
          onChange={() => onToggle(section, field, option, isSingleSelect)}
          disabled={mode === 'view'}
        />
        <label htmlFor={`${namePrefix}-${option}`}>
          {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, ' ')}
        </label>
      </div>
    ))}
  </>
);
