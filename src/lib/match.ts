import type { DocumentId, Evaluation, Profile, Scholarship } from '../types';
import { NER_STATES } from '../data/profile';
import { daysUntil } from './dates';

/** Explainable screening, not an eligibility decision. Unanswered criteria are never assumed to pass. */
export function evaluate(s: Scholarship, p: Profile, readyDocs: readonly DocumentId[]): Evaluation {
  let score = 0; const reasons: string[] = [], gaps: string[] = [], unknowns: string[] = [];
  if (s.levels.includes(p.level)) { score += 22; reasons.push(`fits your ${p.level} study level`); } else gaps.push(`requires ${s.levels.join(' or ')}`);
  if (s.categories.includes('All')) { score += 20; reasons.push('open to all categories'); }
  else if (p.category === 'All') unknowns.push('select your category');
  else if (s.categories.includes(p.category)) { score += 20; reasons.push(`${p.category} category applies`); }
  else gaps.push(`reserved for ${s.categories.join('/')}`);
  if (s.incomeCap === null) { score += 20; reasons.push('no income cap in the published summary'); }
  else if (p.income === null) unknowns.push('add annual family income');
  else if (p.income <= s.incomeCap) { score += 20; reasons.push('income is within the published limit'); }
  else gaps.push('income exceeds the published cap');
  if (s.requiresAbove80Percentile === true) unknowns.push('confirm Class XII stream percentile is above 80 (percentage is not percentile)');
  if (s.minMarks === null) score += 16;
  else if (p.marks === null) unknowns.push('add your last marks');
  else if (p.marks >= s.minMarks) { score += 16; reasons.push(`meets the ${s.minMarks}% marks requirement`); }
  else gaps.push(`needs at least ${s.minMarks}% marks`);
  if (s.state === 'All') { score += 12; reasons.push('open across India'); }
  else if (p.state === '') unknowns.push('select your state');
  else if (s.state === 'NER' ? (NER_STATES as readonly string[]).includes(p.state) : s.state === p.state) { score += 12; reasons.push(s.state === 'NER' ? 'North Eastern Region domicile criterion matches; confirm Class XII school in NER' : `${p.state} residents qualify`); }
  else gaps.push(`${s.state === 'NER' ? 'NER domicile and Class XII from an NER school required' : s.state + ' residents only'}`);
  if (s.gender === undefined) score += 10;
  else if (p.gender === 'Unspecified') unknowns.push('specify gender for this scheme');
  else if (s.gender === p.gender) { score += 10; reasons.push('gender criterion matches'); }
  else gaps.push('gender-specific eligibility');
  if (s.requiresDisability === true) {
    if (p.disability === null) unknowns.push('confirm benchmark-disability status');
    else if (!p.disability) gaps.push('requires at least 40% benchmark disability');
  }
  if (s.requiresMinority === true) {
    if (p.minority === null) unknowns.push('confirm notified-minority status');
    else if (!p.minority) gaps.push('requires a notified minority community');
  }
  const docsRequired = s.docs.length, docsReady = s.docs.filter((d) => readyDocs.includes(d)).length;
  return { eligible: gaps.length === 0 && unknowns.length === 0, score, reasons, gaps, unknowns, docsReady, docsRequired, docCompletion: docsRequired === 0 ? 1 : docsReady / docsRequired };
}
export interface RankedScholarship { scholarship: Scholarship; evaluation: Evaluation }
export function rankScholarships(list: readonly Scholarship[], profile: Profile, readyDocs: readonly DocumentId[], now = new Date()): RankedScholarship[] {
  const priority = (s: Scholarship): number => { const d = daysUntil(s.deadline, now); return Number.isNaN(d) ? 2 : d < 0 ? 3 : 0; };
  return list.map((scholarship) => ({ scholarship, evaluation: evaluate(scholarship, profile, readyDocs) })).sort((a, b) =>
    Number(b.evaluation.eligible) - Number(a.evaluation.eligible) || priority(a.scholarship) - priority(b.scholarship) ||
    b.evaluation.score - a.evaluation.score || b.evaluation.docCompletion - a.evaluation.docCompletion ||
    (a.scholarship.deadline ?? '9999').localeCompare(b.scholarship.deadline ?? '9999') || a.scholarship.id - b.scholarship.id);
}
