/** Single responsibility: data shape for the printable mental status exam form. */
export interface MentalWellnessFormData {
  clientName: string;
  date: string;
  observations: {
    appearance: string[];
    speech: string[];
    eyeContact: string[];
    motorActivity: string[];
    affect: string[];
    comments: string;
  };
  mood: { options: string[]; comments: string };
  cognition: {
    orientationImpairment: string[];
    memoryImpairment: string[];
    attention: string[];
    comments: string;
  };
  perception: { hallucinations: string[]; other: string[]; comments: string };
  thoughts: {
    suicidality: string[];
    homicidality: string[];
    delusions: string[];
    comments: string;
  };
  behavior: { options: string[]; comments: string };
  insight: { option: string; comments: string };
  judgment: { option: string; comments: string };
}

export interface MentalWellnessFormProps {
  data: MentalWellnessFormData;
  mode?: 'view' | 'edit';
  onChange?: (data: MentalWellnessFormData) => void;
  className?: string;
}
