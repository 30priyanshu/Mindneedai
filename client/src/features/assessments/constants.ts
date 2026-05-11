import type { AssessmentQuestion } from './types';

const LIKERT_OPTIONS: AssessmentQuestion['options'] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

/**
 * PHQ-9 question definitions — IDs MUST match backend scoring prefix 'phq9_'.
 * These are kept as a fallback; AssessmentPage fetches from backend API first.
 */
export const PHQ9_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 'phq9_1', text: 'Little interest or pleasure in doing things', options: LIKERT_OPTIONS },
  { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', options: LIKERT_OPTIONS },
  { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', options: LIKERT_OPTIONS },
  { id: 'phq9_4', text: 'Feeling tired or having little energy', options: LIKERT_OPTIONS },
  { id: 'phq9_5', text: 'Poor appetite or overeating', options: LIKERT_OPTIONS },
  { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', options: LIKERT_OPTIONS },
  { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: LIKERT_OPTIONS },
  { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual', options: LIKERT_OPTIONS },
  { id: 'phq9_9', text: 'Thoughts that you would be better off dead, or of hurting yourself', options: LIKERT_OPTIONS },
];

/**
 * GAD-7 question definitions — IDs MUST match backend scoring prefix 'gad7_'.
 * These are kept as a fallback; AssessmentPage fetches from backend API first.
 */
export const GAD7_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', options: LIKERT_OPTIONS },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying', options: LIKERT_OPTIONS },
  { id: 'gad7_3', text: 'Worrying too much about different things', options: LIKERT_OPTIONS },
  { id: 'gad7_4', text: 'Trouble relaxing', options: LIKERT_OPTIONS },
  { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', options: LIKERT_OPTIONS },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', options: LIKERT_OPTIONS },
  { id: 'gad7_7', text: 'Feeling afraid, as if something awful might happen', options: LIKERT_OPTIONS },
];
