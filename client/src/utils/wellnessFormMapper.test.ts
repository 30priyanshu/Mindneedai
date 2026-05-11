import { describe, expect, it } from 'vitest';
import {
  createEmptyMentalWellnessFormData,
  isMentalWellnessFormShape,
  mapBackendToMentalWellnessFormData,
  mapMentalWellnessToBackend,
} from './wellnessFormMapper';

describe('wellnessFormMapper', () => {
  it('detects mental wellness backend shape', () => {
    expect(isMentalWellnessFormShape({ observations: {} })).toBe(true);
    expect(isMentalWellnessFormShape({ chief_complaint: 'x' })).toBe(false);
  });

  it('round-trips through backend map with stable keys', () => {
    const empty = createEmptyMentalWellnessFormData();
    empty.clientName = 'Test';
    empty.observations.appearance = ['neat'];
    const backend = mapMentalWellnessToBackend(empty);
    const back = mapBackendToMentalWellnessFormData(backend, 'Test', empty.date);
    expect(back.clientName).toBe('Test');
    expect(back.observations.appearance).toEqual(['neat']);
  });
});
