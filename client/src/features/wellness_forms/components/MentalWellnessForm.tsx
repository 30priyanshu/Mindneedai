import React from 'react';
import './mental-wellness-form-base.css';
import './mental-wellness-form-print.css';
import { MentalWellnessFormBody } from './MentalWellnessFormBody';
import { useMentalWellnessFieldHandlers } from './useMentalWellnessFieldHandlers';
import type { MentalWellnessFormProps } from './mentalWellnessForm.types';

export type { MentalWellnessFormData } from './mentalWellnessForm.types';

/** Single responsibility: printable mental wellness form shell + field handler wiring. */
export const MentalWellnessForm: React.FC<MentalWellnessFormProps> = ({
  data,
  mode = 'view',
  onChange,
  className,
}) => {
  const { handleCheckboxChange, handleTextChange } = useMentalWellnessFieldHandlers(data, mode, onChange);

  return (
    <div className={`mental-wellness-form ${className ?? ''}`}>
      <MentalWellnessFormBody
        data={data}
        mode={mode}
        handleCheckboxChange={handleCheckboxChange}
        handleTextChange={handleTextChange}
      />
    </div>
  );
};
