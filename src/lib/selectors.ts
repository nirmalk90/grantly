import type { DocumentId, Profile, Scholarship, Stage } from '../types';
import { DOCUMENTS } from '../services/catalog';
import { daysUntil, greeting } from './dates';
import { rankScholarships } from './match';
import type { RankedScholarship } from './match';
export function getEvaluatedScholarships(catalog: readonly Scholarship[], profile: Profile, readyDocs: readonly DocumentId[], now = new Date()): RankedScholarship[] { return rankScholarships(catalog, profile, readyDocs, now); }
export function getEligibleScholarships(evaluated: readonly RankedScholarship[]): RankedScholarship[] { return evaluated.filter((i) => i.evaluation.eligible); }
export function getOpenScholarships(evaluated: readonly RankedScholarship[], now = new Date()): RankedScholarship[] {
  return evaluated.filter((i) => daysUntil(i.scholarship.deadline, now) >= 0).sort((a, b) => (a.scholarship.deadline ?? '').localeCompare(b.scholarship.deadline ?? '') || a.scholarship.id - b.scholarship.id);
}
export function getClosingSoon(open: readonly RankedScholarship[], now = new Date()): RankedScholarship[] { return open.filter((i) => daysUntil(i.scholarship.deadline, now) <= 14); }
export function getTrackedScholarships(catalog: readonly Scholarship[], tracking: Record<number, Stage>): Scholarship[] { return catalog.filter((s) => tracking[s.id] !== undefined); }
export function getTrackedByStage(catalog: readonly Scholarship[], tracking: Record<number, Stage>): Record<Stage, Scholarship[]> {
  const byStage: Record<Stage, Scholarship[]> = { saved: [], progress: [], submitted: [], awarded: [] };
  for (const s of getTrackedScholarships(catalog, tracking)) { const stage = tracking[s.id]; if (stage !== undefined) byStage[stage].push(s); }
  return byStage;
}
export function getOpenTrackedCount(catalog: readonly Scholarship[], tracking: Record<number, Stage>, now = new Date()): number { return getTrackedScholarships(catalog, tracking).filter((s) => daysUntil(s.deadline, now) >= 0).length; }
export function getDocumentReadiness(readyDocs: readonly DocumentId[]): { ready: number; total: number; ratio: number } {
  const ready = DOCUMENTS.filter((d) => readyDocs.includes(d)).length, total = DOCUMENTS.length;
  return { ready, total, ratio: ready / total };
}
export function getRelevantDocumentReadiness(scholarships: readonly Scholarship[], readyDocs: readonly DocumentId[]): { ready: number; total: number; ratio: number } {
  const required = new Set(scholarships.flatMap((s) => s.docs));
  const ready = [...required].filter((d) => readyDocs.includes(d)).length;
  return { ready, total: required.size, ratio: required.size === 0 ? 0 : ready / required.size };
}
export function getGreeting(now = new Date()): string { return greeting(now); }
