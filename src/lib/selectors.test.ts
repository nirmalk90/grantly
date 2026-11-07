import { describe, expect, it } from 'vitest';
import { DEMO_PRESET } from '../state/defaults';
import { testScholarships } from '../test/fixtures';
import { getEvaluatedScholarships, getOpenScholarships, getRelevantDocumentReadiness, getTrackedByStage } from './selectors';
describe('shared selectors', () => {
  it('excludes expired and unknown dates from open lists', () => { const now = new Date('2026-11-07T12:00:00+05:30'); const evaluated = getEvaluatedScholarships(testScholarships, DEMO_PRESET.profile, [], now); const open = getOpenScholarships(evaluated, now); expect(open.length).toBeGreaterThan(0); expect(open.every((x) => x.scholarship.deadline !== null)).toBe(true); expect(getOpenScholarships(evaluated, new Date('2030-01-01'))).toHaveLength(0); });
  it('groups tracked scholarships by stage', () => { const byStage = getTrackedByStage(testScholarships, DEMO_PRESET.tracking); expect(byStage.saved.map((s) => s.id)).toContain(4); expect(byStage.progress.map((s) => s.id)).toContain(5); });
  it('calculates readiness only across relevant documents', () => { const first = testScholarships[0]; if (!first) throw new Error('fixture'); const r = getRelevantDocumentReadiness([first], ['Aadhaar']); expect(r.total).toBe(first.docs.length); expect(r.ready).toBe(1); });
});
