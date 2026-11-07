import { describe, expect, it } from 'vitest';
import type { Profile, Scholarship } from '../types';
import { DEMO_PROFILE, INITIAL_PROFILE } from '../state/defaults';
import { testScholarships } from '../test/fixtures';
import { evaluate, rankScholarships } from './match';
const base = testScholarships[0] as Scholarship;
const scholarship: Scholarship = { ...base, categories: ['All'], incomeCap: 250000, minMarks: 80, gender: undefined, requiresDisability: false, requiresAbove80Percentile: false, state: 'All', levels: ['UG'] };
const profile: Profile = { ...DEMO_PROFILE, income: 250000, marks: 80 };
describe('explainable screening', () => {
  it('matches inclusive boundaries but does not call screening an award decision', () => { const r = evaluate(scholarship, profile, ['Aadhaar']); expect(r.eligible).toBe(true); expect(r.score).toBe(100); expect(r.docCompletion).toBeGreaterThan(0); });
  it('never assumes missing profile values pass', () => { const r = evaluate(scholarship, INITIAL_PROFILE, []); expect(r.eligible).toBe(false); expect(r.unknowns.length).toBeGreaterThanOrEqual(2); });
  it('does not treat unspecified category as reserved', () => { const s = { ...scholarship, categories: ['SC'] as Scholarship['categories'] }; expect(evaluate(s, profile, []).eligible).toBe(false); expect(evaluate(s, { ...profile, category: 'SC' }, []).eligible).toBe(true); });
  it('checks disability and gender requirements', () => { expect(evaluate({ ...scholarship, requiresDisability: true }, profile, []).eligible).toBe(false); expect(evaluate({ ...scholarship, gender: 'M' }, profile, []).eligible).toBe(false); });
  it('ranks deterministically with unknown dates last', () => { const a = { ...scholarship, id: 100, deadline: null }, b = { ...scholarship, id: 101, deadline: '2026-12-01' }; expect(rankScholarships([a, b], profile, [], new Date('2026-11-07'))[0]?.scholarship.id).toBe(101); });
});

describe('sourced special criteria', () => {
  const profile = { ...DEMO_PROFILE, category: 'General' as const };
  it('requires NER domicile and never equates percentage with percentile', () => {
    const ishan = testScholarships.find(s => s.id === 12) as Scholarship;
    expect(evaluate(ishan, profile, []).eligible).toBe(false);
    expect(evaluate(ishan, { ...profile, state: 'Assam' }, []).reasons.join(' ')).toContain('North Eastern Region');
    const csss = testScholarships.find(s => s.id === 1) as Scholarship;
    expect(evaluate(csss, { ...profile, marks: 99 }, []).unknowns.join(' ')).toContain('percentile');
    expect(evaluate(csss, { ...profile, marks: 99 }, []).eligible).toBe(false);
  });
});
