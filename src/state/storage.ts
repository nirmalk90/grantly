import type { DocumentId, PersistedData, Profile, Stage } from '../types';
import { CATEGORIES, GENDERS, LEVELS, PROFILE_LIMITS, STATES } from '../data/profile';
import { DOCUMENTS } from '../services/catalog';
import { cleanText, isFiniteNumber, isRecord } from '../lib/sanitize';
import { isIsoDate } from '../lib/dates';

export const STORAGE_KEY = 'grantly.v3';
export const SCHEMA_VERSION = 3;
const STAGES: readonly Stage[] = ['saved', 'progress', 'submitted', 'awarded'];
const KNOWN_DOCS = new Set<string>(DOCUMENTS);
export type StorageStatus = 'empty' | 'loaded' | 'recovered' | 'unavailable';
export interface LoadResult { data: Partial<PersistedData>; status: StorageStatus }
let currentStatus: StorageStatus = 'empty';
const listeners = new Set<() => void>();
export function getStorageStatusSnapshot(): StorageStatus { return currentStatus; }
export function subscribeStorageStatus(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
function publishStatus(status: StorageStatus): void { if (currentStatus !== status) { currentStatus = status; listeners.forEach((l) => l()); } }
function withStatus(result: LoadResult): LoadResult { publishStatus(result.status); return result; }
const inRange = (v: unknown, min: number, max: number): v is number => isFiniteNumber(v) && v >= min && v <= max;

export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null;
  const disability = value.disability === null || typeof value.disability === 'boolean' ? value.disability : undefined;
  const minority = value.minority === null || typeof value.minority === 'boolean' ? value.minority : undefined;
  if (typeof value.name !== 'string' || typeof value.interests !== 'string' || !LEVELS.includes(value.level as never) || !CATEGORIES.includes(value.category as never) ||
    !GENDERS.includes(value.gender as never) || typeof value.state !== 'string' || (value.state !== '' && !STATES.includes(value.state as never)) ||
    !(value.income === null || inRange(value.income, PROFILE_LIMITS.incomeMin, PROFILE_LIMITS.incomeMax)) ||
    !(value.marks === null || inRange(value.marks, PROFILE_LIMITS.marksMin, PROFILE_LIMITS.marksMax)) || disability === undefined || minority === undefined || typeof value.complete !== 'boolean') return null;
  const profile: Profile = {
    name: cleanText(value.name, PROFILE_LIMITS.nameMaxLength), interests: cleanText(value.interests, PROFILE_LIMITS.interestsMaxLength),
    level: value.level as Profile['level'], category: value.category as Profile['category'], gender: value.gender as Profile['gender'], state: value.state,
    income: value.income, marks: value.marks, disability, minority, complete: value.complete,
  };
  if (profile.complete && (profile.income === null || profile.marks === null || profile.state === '' || profile.gender === 'Unspecified' || profile.category === 'All' || profile.disability === null || profile.minority === null)) profile.complete = false;
  return profile;
}
function parseTracking(value: unknown, ids: ReadonlySet<number>): { tracking: Record<number, Stage>; valid: boolean } {
  const tracking: Record<number, Stage> = {};
  if (!isRecord(value)) return { tracking, valid: false };
  let valid = true;
  for (const [key, stage] of Object.entries(value)) {
    const id = Number(key);
    if (!Number.isSafeInteger(id) || !ids.has(id) || !STAGES.includes(stage as Stage)) { valid = false; continue; }
    tracking[id] = stage as Stage;
  }
  return { tracking, valid };
}
function parseDocs(value: unknown): { docs: DocumentId[]; valid: boolean } {
  if (!Array.isArray(value)) return { docs: [], valid: false };
  const docs: DocumentId[] = []; let valid = value.length <= DOCUMENTS.length;
  for (const item of value) {
    if (typeof item !== 'string' || !KNOWN_DOCS.has(item)) { valid = false; continue; }
    const doc = item as DocumentId; if (!docs.includes(doc)) docs.push(doc);
  }
  return { docs, valid };
}
function parseNotes(value: unknown, tracking: Record<number, Stage>): { notes: Record<number, string>; valid: boolean } {
  const notes: Record<number, string> = {};
  if (!isRecord(value)) return { notes, valid: false };
  let valid = true;
  for (const [key, note] of Object.entries(value)) {
    if (tracking[Number(key)] === undefined || typeof note !== 'string') { valid = false; continue; }
    notes[Number(key)] = cleanText(note, 1000, true);
  }
  return { notes, valid };
}
function parseReminders(value: unknown, tracking: Record<number, Stage>): { reminders: Record<number, string>; valid: boolean } {
  const reminders: Record<number, string> = {};
  if (!isRecord(value)) return { reminders, valid: false };
  let valid = true;
  for (const [key, date] of Object.entries(value)) {
    if (tracking[Number(key)] === undefined || typeof date !== 'string' || !isIsoDate(date)) { valid = false; continue; }
    reminders[Number(key)] = date;
  }
  return { reminders, valid };
}
export function parsePersisted(raw: unknown, knownIds: ReadonlySet<number> = new Set()): LoadResult {
  if (!isRecord(raw)) return { data: {}, status: 'recovered' };
  let recovered = raw.schemaVersion !== SCHEMA_VERSION;
  const data: Partial<PersistedData> = {};
  const profile = parseProfile(raw.profile); if (profile !== null) data.profile = profile; else recovered = true;
  const tracking = parseTracking(raw.tracking, knownIds); data.tracking = tracking.tracking; recovered ||= !tracking.valid;
  const docs = parseDocs(raw.readyDocs); data.readyDocs = docs.docs; recovered ||= !docs.valid;
  const notes = parseNotes(raw.notes, tracking.tracking); data.notes = notes.notes; recovered ||= !notes.valid;
  const reminders = parseReminders(raw.reminders, tracking.tracking); data.reminders = reminders.reminders; recovered ||= !reminders.valid;
  if (raw.theme === 'dark' || raw.theme === 'light') data.theme = raw.theme; else recovered = true;
  if (typeof raw.tourSeen === 'boolean') data.tourSeen = raw.tourSeen; else recovered = true;
  return { data, status: recovered ? 'recovered' : 'loaded' };
}
export function loadPersisted(knownIds: ReadonlySet<number>): LoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return withStatus(parsePersisted(JSON.parse(raw), knownIds));
    // Migrate only profile/theme from v2. Never reinterpret fictional demo tracking as real applications.
    const previous = window.localStorage.getItem('grantly.v2');
    if (previous !== null) {
      const old: unknown = JSON.parse(previous);
      if (isRecord(old)) {
        const data: Partial<PersistedData> = {};
        const p = isRecord(old.profile) ? parseProfile({ ...old.profile, disability: null, minority: null, complete: false }) : null;
        if (p !== null) data.profile = p;
        if (old.theme === 'light' || old.theme === 'dark') data.theme = old.theme;
        return withStatus({ data, status: 'recovered' });
      }
    }
    return withStatus({ data: {}, status: 'empty' });
  } catch { return withStatus({ data: {}, status: 'unavailable' }); }
}
export function savePersisted(state: PersistedData): boolean {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, ...state })); if (currentStatus === 'unavailable') publishStatus('loaded'); return true; }
  catch { publishStatus('unavailable'); return false; }
}
export function clearPersisted(): boolean {
  try { window.localStorage.removeItem(STORAGE_KEY); window.localStorage.removeItem('grantly.v2'); publishStatus('empty'); return true; }
  catch { publishStatus('unavailable'); return false; }
}
