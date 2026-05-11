import type { MentalWellnessFormData } from './mentalWellnessForm.types';

export interface MentalWellnessSectionHandlers {
  handleCheckboxChange: (
    s: keyof MentalWellnessFormData,
    field: string,
    value: string,
    single?: boolean,
  ) => void;
  handleTextChange: (s: keyof MentalWellnessFormData | 'clientName' | 'date', field: string, v: string) => void;
}

export interface MentalWellnessSectionsProps extends MentalWellnessSectionHandlers {
  data: MentalWellnessFormData;
  mode: 'view' | 'edit';
}
