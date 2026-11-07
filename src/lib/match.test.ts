import { describe, expect, it } from 'vitest';
import type { Profile, Scholarship } from '../types';
import { evaluate, rankScholarships } from './match';

const profile: Profile = {
  name: 'Test Student',
  level: 'UG',
  category: 'All',
  income: 250_000,
  marks: 80,
  state: 'Bihar',
  gender: 'F',
  interests: 'science',
};

const scholarship: Scholarship = {
  id: 1,
  name: 'Test Scholarship',
  org: 'Test Org',
  initials: 'TS',
  amount: '₹10,000',
  incomeCap: 250_000,
  levels: ['UG'],
  categories: ['All'],
  minMarks: 80,
  state: 'All',
  deadline: '2026-12-01',
  docs: ['Aadhaar', 'Income certificate'],
  kind: 'Test',
  tone: 'green',
  about: '',
  applyUrl: 'https://example.com',
};

describe('explainable matching', () => {
  it('treats income and marks boundaries as inclusive', () => {
    const result = evaluate(scholarship, profile, ['Aadhaar']);
    expect(result.eligible).toBe(true);
    expect(result.score).toBe(100);
    expect(result.docsReady).toBe(1);
    expect(result.docCompletion).toBe(0.5);
  });

  it('does not treat an unspecified profile category as a reserved category', () => {
    const reserved = { ...scholarship, categories: ['SC'] as Scholarship['categories'] };
    expect(evaluate(reserved, profile, []).eligible).toBe(false);
    expect(evaluate(reserved, { ...profile, category: 'SC' }, []).eligible).toBe(true);
  });

  it('supports null income caps and gender-specific gaps', () => {
    expect(evaluate({ ...scholarship, incomeCap: null }, { ...profile, income: 9_000_000 }, []).eligible).toBe(true);
    expect(evaluate({ ...scholarship, gender: 'M' }, profile, []).gaps).toContain('gender-specific eligibility');
  });

  it('ranks deterministically', () => {
    const a = { ...scholarship, id: 2, deadline: '2026-12-02' };
    const b = { ...scholarship, id: 1, deadline: '2026-12-01' };
    const ranked = rankScholarships([a, b], profile, []);
    expect(ranked[0]?.scholarship.id).toBe(1);
  });
});
