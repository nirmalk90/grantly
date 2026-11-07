import { describe, expect, it } from 'vitest';
import { DEMO_PRESET, SCHOLARSHIPS } from '../data/scholarships';
import { INITIAL_PROFILE } from '../state/defaults';
import { getEvaluatedScholarships, getOpenScholarships, getRelevantDocumentReadiness, getTrackedByStage } from './selectors';

describe('shared selectors', () => {
  it('excludes expired opportunities from open lists', () => {
    const evaluated = getEvaluatedScholarships(INITIAL_PROFILE, []);
    expect(getOpenScholarships(evaluated, new Date('2030-01-01T00:00:00Z'))).toHaveLength(0);
    expect(getOpenScholarships(evaluated).length).toBeGreaterThan(0);
  });

  it('groups tracked scholarships by stage', () => {
    const byStage = getTrackedByStage(DEMO_PRESET.tracking);
    expect(byStage.awarded.map((s) => s.id)).toContain(10);
    expect(byStage.progress.map((s) => s.id)).toContain(9);
  });

  it('calculates readiness only across relevant documents', () => {
    const first = SCHOLARSHIPS[0];
    if (first === undefined) throw new Error('Expected demo scholarship data');
    const readiness = getRelevantDocumentReadiness([first], ['Aadhaar']);
    expect(readiness.total).toBe(first.docs.length);
    expect(readiness.ready).toBe(1);
  });
});
