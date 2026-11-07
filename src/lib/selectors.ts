import type { DocumentId, Profile, Scholarship, Stage } from '../types';
import { DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import { daysUntil, greeting } from './dates';
import { rankScholarships } from './match';
import type { RankedScholarship } from './match';

export function getEvaluatedScholarships(profile: Profile, readyDocs: readonly DocumentId[]): RankedScholarship[] {
  return rankScholarships(SCHOLARSHIPS, profile, readyDocs);
}

export function getEligibleScholarships(evaluated: readonly RankedScholarship[]): RankedScholarship[] {
  return evaluated.filter((item) => item.evaluation.eligible);
}

export function getOpenScholarships(evaluated: readonly RankedScholarship[], now: Date = new Date()): RankedScholarship[] {
  return evaluated
    .filter((item) => daysUntil(item.scholarship.deadline, now) >= 0)
    .sort((a, b) => a.scholarship.deadline.localeCompare(b.scholarship.deadline) || a.scholarship.id - b.scholarship.id);
}

export function getClosingSoon(open: readonly RankedScholarship[], now: Date = new Date()): RankedScholarship[] {
  return open.filter((item) => daysUntil(item.scholarship.deadline, now) <= 14);
}

export function getTrackedScholarships(tracking: Record<number, Stage>): Scholarship[] {
  return SCHOLARSHIPS.filter((s) => tracking[s.id] !== undefined);
}

export function getTrackedByStage(tracking: Record<number, Stage>): Record<Stage, Scholarship[]> {
  const byStage: Record<Stage, Scholarship[]> = { saved: [], progress: [], submitted: [], awarded: [] };
  for (const scholarship of SCHOLARSHIPS) {
    const stage = tracking[scholarship.id];
    if (stage !== undefined) byStage[stage].push(scholarship);
  }
  return byStage;
}

export function getOpenTrackedCount(tracking: Record<number, Stage>, now: Date = new Date()): number {
  return getTrackedScholarships(tracking).filter((s) => daysUntil(s.deadline, now) >= 0).length;
}

export function getDocumentReadiness(readyDocs: readonly DocumentId[]): { ready: number; total: number; ratio: number } {
  const known = DOCUMENTS.filter((doc) => readyDocs.includes(doc));
  const total = DOCUMENTS.length;
  return { ready: known.length, total, ratio: total === 0 ? 0 : known.length / total };
}

/** Readiness across the unique documents required by the supplied opportunities. */
export function getRelevantDocumentReadiness(
  scholarships: readonly Scholarship[],
  readyDocs: readonly DocumentId[],
): { ready: number; total: number; ratio: number } {
  const required = new Set<DocumentId>();
  for (const scholarship of scholarships) {
    for (const doc of scholarship.docs) required.add(doc);
  }
  const ready = [...required].filter((doc) => readyDocs.includes(doc)).length;
  const total = required.size;
  return { ready, total, ratio: total === 0 ? 0 : ready / total };
}

export function getGreeting(now: Date = new Date()): string {
  return greeting(now);
}
