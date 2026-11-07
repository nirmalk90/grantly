import type { Evaluation, Profile, Scholarship } from '../types';
import { NO_CAP } from '../data/scholarships';

/**
 * Weighted, explainable matching rubric (max 100 pts).
 * Every point bucket is reported back to the user so matches are never a black box.
 */
export function evaluate(scholarship: Scholarship, profile: Profile, readyDocs: readonly string[]): Evaluation {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];

  if (scholarship.levels.includes(profile.level)) {
    score += 22;
    reasons.push(`fits your ${profile.level} study level`);
  } else {
    gaps.push(`requires ${scholarship.levels.join(' or ')}`);
  }

  if (scholarship.categories.includes('All') || scholarship.categories.includes(profile.category)) {
    score += 20;
    if (!scholarship.categories.includes('All')) reasons.push(`${profile.category} category applies`);
  } else {
    gaps.push(`reserved for ${scholarship.categories.join('/')} categories`);
  }

  if (profile.income <= scholarship.incomeCap) {
    score += 20;
    if (scholarship.incomeCap < NO_CAP) reasons.push('family income fits the limit');
  } else {
    gaps.push('income exceeds the published cap');
  }

  if (profile.marks >= scholarship.minMarks) {
    score += 16;
    if (scholarship.minMarks > 0) reasons.push(`meets the ${scholarship.minMarks}% marks requirement`);
  } else {
    gaps.push(`needs at least ${scholarship.minMarks}% marks`);
  }

  if (scholarship.state === 'All' || scholarship.state === profile.state) {
    score += 12;
    if (scholarship.state !== 'All') reasons.push(`${profile.state} residents qualify`);
  } else {
    gaps.push(`${scholarship.state} residents only`);
  }

  if (scholarship.gender === undefined || scholarship.gender === profile.gender) {
    score += 10;
  } else {
    gaps.push('gender-specific eligibility');
  }

  const docsRequired = scholarship.docs.length;
  const docsReady = scholarship.docs.filter((doc) => readyDocs.includes(doc)).length;
  const docCompletion = docsRequired === 0 ? 1 : docsReady / docsRequired;

  return {
    eligible: gaps.length === 0,
    score: Math.round(score),
    reasons,
    gaps,
    docsReady,
    docsRequired,
    docCompletion,
  };
}

export interface RankedScholarship {
  scholarship: Scholarship;
  evaluation: Evaluation;
}

export function rankScholarships(
  list: readonly Scholarship[],
  profile: Profile,
  readyDocs: readonly string[],
): RankedScholarship[] {
  return list
    .map((scholarship) => ({ scholarship, evaluation: evaluate(scholarship, profile, readyDocs) }))
    .sort(
      (a, b) =>
        Number(b.evaluation.eligible) - Number(a.evaluation.eligible) ||
        b.evaluation.score - a.evaluation.score ||
        b.evaluation.docCompletion - a.evaluation.docCompletion,
    );
}
