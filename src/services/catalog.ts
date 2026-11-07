import type { CatalogSnapshot, Scholarship } from '../types';
import { CATEGORIES, GENDERS, LEVELS, STATES } from '../data/profile';
import { isFiniteNumber, isRecord } from '../lib/sanitize';
import { isIsoDate } from '../lib/dates';

export const DOCUMENTS = [
  'Aadhaar', 'Income certificate', 'Caste certificate', 'Category certificate', 'Marksheet',
  'Class 12 marksheet', 'Residence certificate', 'Bank passbook', 'Admission letter', 'Fee receipt',
  'Statement of purpose', 'Offer letter', 'Passport', 'Graduation certificate', 'Disability certificate',
  'UDID card', 'Minority declaration', 'Institution verification', 'Previous scholarship details',
] as const;
const docs = new Set<string>(DOCUMENTS);
const text = (v: unknown, max = 1500): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const nullableText = (v: unknown): boolean => v === null || text(v);
const strings = (v: unknown, allowed?: readonly string[]): v is string[] => Array.isArray(v) && v.length > 0 && v.length <= 100 && v.every((x) => text(x, allowed === undefined ? 1000 : 100) && (allowed === undefined || allowed.includes(x)));
const https = (v: unknown): v is string => {
  if (!text(v, 2000)) return false;
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
};
const date = (v: unknown): boolean => v === null || (typeof v === 'string' && isIsoDate(v));

export function parseCatalog(raw: unknown): CatalogSnapshot {
  if (!isRecord(raw) || raw.schemaVersion !== 1 || raw.timezone !== 'Asia/Kolkata' || !date(raw.verifiedAt) || raw.verifiedAt === null || !Array.isArray(raw.scholarships) || raw.scholarships.length === 0 || raw.scholarships.length > 500) {
    throw new Error('Unsupported scholarship catalogue format.');
  }
  const ids = new Set<number>();
  const slugs = new Set<string>();
  for (const s of raw.scholarships) {
    if (!isRecord(s) || !Number.isSafeInteger(s.id) || Number(s.id) < 1 || ids.has(Number(s.id)) || !text(s.slug, 100) || !/^[a-z0-9-]+$/.test(s.slug) || slugs.has(s.slug) ||
      !text(s.name, 250) || !text(s.org, 150) || !text(s.initials, 4) || !(s.amount === null || (isFiniteNumber(s.amount) && s.amount >= 0)) || !text(s.awardLabel, 250) ||
      !['grant', 'loan'].includes(String(s.fundingType)) || !(s.incomeCap === null || (isFiniteNumber(s.incomeCap) && s.incomeCap >= 0)) ||
      !strings(s.levels, LEVELS) || !strings(s.categories, CATEGORIES) || !(s.minMarks === null || (isFiniteNumber(s.minMarks) && s.minMarks >= 0 && s.minMarks <= 100)) ||
      !(['All', 'NER'].includes(String(s.state)) || STATES.includes(s.state as never)) || (s.gender !== undefined && !GENDERS.includes(s.gender as never)) ||
      (s.requiresDisability !== undefined && typeof s.requiresDisability !== 'boolean') || (s.requiresMinority !== undefined && typeof s.requiresMinority !== 'boolean') || (s.requiresAbove80Percentile !== undefined && typeof s.requiresAbove80Percentile !== 'boolean') ||
      !['fresh', 'renewal', 'both'].includes(String(s.applicationType)) || !date(s.deadline) || !date(s.opensAt) || !text(s.deadlineNote) ||
      !strings(s.docs, DOCUMENTS) || !text(s.kind, 100) || !['green', 'amber', 'violet'].includes(String(s.tone)) || !text(s.about, 3000) ||
      !strings(s.conditions) || !https(s.applyUrl) || !https(s.sourceUrl) || !nullableText(s.guidelinesUrl) || (s.guidelinesUrl !== null && !https(s.guidelinesUrl)) || !date(s.verifiedAt) || s.verifiedAt === null) {
      throw new Error('A scholarship record failed validation.');
    }
    if (!s.docs.every((d) => typeof d === 'string' && docs.has(d))) throw new Error('Unknown document in catalogue.');
    ids.add(Number(s.id)); slugs.add(s.slug);
  }
  return raw as unknown as CatalogSnapshot;
}

export interface CatalogRepository { load(signal?: AbortSignal): Promise<CatalogSnapshot> }

/** Replace this adapter with an API implementation without changing the UI. */
export const catalogRepository: CatalogRepository = {
  async load(signal) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/scholarships.json`, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Catalogue unavailable (${response.status}).`);
    return parseCatalog(await response.json());
  },
};

export function findScholarship(catalog: readonly Scholarship[], id: number): Scholarship | undefined {
  return catalog.find((s) => s.id === id);
}
