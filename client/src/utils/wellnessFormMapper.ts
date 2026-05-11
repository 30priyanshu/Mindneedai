import type { MentalWellnessFormData } from '@/features/wellness_forms/components/mentalWellnessForm.types';

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Single responsibility: map mental wellness JSON between API payload and UI form model. */
export const createEmptyMentalWellnessFormData = (): MentalWellnessFormData => ({
  clientName: '',
  date: new Date().toISOString().split('T')[0],
  observations: { appearance: [], speech: [], eyeContact: [], motorActivity: [], affect: [], comments: '' },
  mood: { options: [], comments: '' },
  cognition: { orientationImpairment: [], memoryImpairment: [], attention: [], comments: '' },
  perception: { hallucinations: [], other: [], comments: '' },
  thoughts: { suicidality: [], homicidality: [], delusions: [], comments: '' },
  behavior: { options: [], comments: '' },
  insight: { option: '', comments: '' },
  judgment: { option: '', comments: '' },
});

export const mapMentalWellnessToBackend = (formData: MentalWellnessFormData): Record<string, unknown> => ({
  observations: {
    appearance: formData.observations.appearance,
    speech: formData.observations.speech,
    eyeContact: formData.observations.eyeContact,
    motorActivity: formData.observations.motorActivity,
    affect: formData.observations.affect,
    comments: formData.observations.comments,
  },
  mood: { options: formData.mood.options, comments: formData.mood.comments },
  cognition: {
    orientationImpairment: formData.cognition.orientationImpairment,
    memoryImpairment: formData.cognition.memoryImpairment,
    attention: formData.cognition.attention,
    comments: formData.cognition.comments,
  },
  perception: {
    hallucinations: formData.perception.hallucinations,
    other: formData.perception.other,
    comments: formData.perception.comments,
  },
  thoughts: {
    suicidality: formData.thoughts.suicidality,
    homicidality: formData.thoughts.homicidality,
    delusions: formData.thoughts.delusions,
    comments: formData.thoughts.comments,
  },
  behavior: { options: formData.behavior.options, comments: formData.behavior.comments },
  insight: { option: formData.insight.option, comments: formData.insight.comments },
  judgment: { option: formData.judgment.option, comments: formData.judgment.comments },
});

export const mapBackendToMentalWellnessFormData = (
  backendData: Record<string, unknown>,
  clientName: string,
  date: string,
): MentalWellnessFormData => {
  const d = createEmptyMentalWellnessFormData();
  const obs = backendData.observations as Record<string, unknown> | undefined;
  const mood = backendData.mood as Record<string, unknown> | undefined;
  const cog = backendData.cognition as Record<string, unknown> | undefined;
  const perc = backendData.perception as Record<string, unknown> | undefined;
  const thou = backendData.thoughts as Record<string, unknown> | undefined;
  const beh = backendData.behavior as Record<string, unknown> | undefined;
  const ins = backendData.insight as Record<string, unknown> | undefined;
  const jud = backendData.judgment as Record<string, unknown> | undefined;

  return {
    clientName: clientName || d.clientName,
    date: date || d.date,
    observations: {
      appearance: asStringArray(obs?.appearance),
      speech: asStringArray(obs?.speech),
      eyeContact: asStringArray(obs?.eyeContact),
      motorActivity: asStringArray(obs?.motorActivity),
      affect: asStringArray(obs?.affect),
      comments: asString(obs?.comments),
    },
    mood: { options: asStringArray(mood?.options), comments: asString(mood?.comments) },
    cognition: {
      orientationImpairment: asStringArray(cog?.orientationImpairment),
      memoryImpairment: asStringArray(cog?.memoryImpairment),
      attention: asStringArray(cog?.attention),
      comments: asString(cog?.comments),
    },
    perception: {
      hallucinations: asStringArray(perc?.hallucinations),
      other: asStringArray(perc?.other),
      comments: asString(perc?.comments),
    },
    thoughts: {
      suicidality: asStringArray(thou?.suicidality),
      homicidality: asStringArray(thou?.homicidality),
      delusions: asStringArray(thou?.delusions),
      comments: asString(thou?.comments),
    },
    behavior: { options: asStringArray(beh?.options), comments: asString(beh?.comments) },
    insight: { option: asString(ins?.option), comments: asString(ins?.comments) },
    judgment: { option: asString(jud?.option), comments: asString(jud?.comments) },
  };
};

export const isMentalWellnessFormShape = (formData: Record<string, unknown>): boolean =>
  typeof formData === 'object' && formData !== null && 'observations' in formData;
