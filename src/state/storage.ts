import type { DocumentId, Profile, Stage, Theme } from '../types';
import { CATEGORIES, GENDERS, LEVELS, PROFILE_LIMITS, STATES } from '../data/profile';
import { DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import { cleanText, isFiniteNumber, isRecord } from '../lib/sanitize';

export const STORAGE_KEY = 'grantly.v2';
export const SCHEMA_VERSION = 2;

const STAGES: readonly Stage[] = ['saved', 'progress', 'submitted', 'awarded'];
const KNOWN_IDS = new Set(SCHOLARSHIPS.map((s) => s.id));
const KNOWN_DOCS = new Set<string>(DOCUMENTS);

export interface PersistedData {
  profile: Profile;
  tracking: Record<number, Stage>;
  readyDocs: DocumentId[];
  theme: Theme;
}

export type StorageStatus = 'empty' | 'loaded' | 'recovered' | 'unavailable';

export interface LoadResult {
  data: Partial<PersistedData>;
  status: StorageStatus;
}

let currentStatus: StorageStatus = 'empty';
const listeners = new Set<() => void>();

export function getStorageStatusSnapshot(): StorageStatus {
  return currentStatus;
}

export function subscribeStorageStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publishStatus(status: StorageStatus): void {
  if (currentStatus === status) return;
  currentStatus = status;
  for (const listener of listeners) listener();
}

function withStatus(result: LoadResult): LoadResult {
  publishStatus(result.status);
  return result;
}

function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === 'string' ? cleanText(value.name, PROFILE_LIMITS.nameMaxLength) : '';
  const level = value.level;
  const category = value.category;
  const gender = value.gender;
  const state = value.state;
  const interests = typeof value.interests === 'string' ? cleanText(value.interests, PROFILE_LIMITS.interestsMaxLength) : null;
  if (
    name === '' ||
    !LEVELS.includes(level as Profile['level']) ||
    !CATEGORIES.includes(category as Profile['category']) ||
    !GENDERS.includes(gender as Profile['gender']) ||
    typeof state !== 'string' ||
    !STATES.includes(state) ||
    !isFiniteNumber(value.income) ||
    !isFiniteNumber(value.marks) ||
    interests === null
  ) {
    return null;
  }
  return {
    name,
    level: level as Profile['level'],
    category: category as Profile['category'],
    gender: gender as Profile['gender'],
    state,
    income: Math.round(Math.min(PROFILE_LIMITS.incomeMax, Math.max(PROFILE_LIMITS.incomeMin, value.income))),
    marks: Math.round(Math.min(PROFILE_LIMITS.marksMax, Math.max(PROFILE_LIMITS.marksMin, value.marks))),
    interests,
  };
}

function parseTracking(value: unknown): { tracking: Record<number, Stage>; valid: boolean } {
  const tracking: Record<number, Stage> = {};
  if (!isRecord(value)) return { tracking, valid: false };
  let valid = true;
  for (const [key, stage] of Object.entries(value)) {
    const id = Number(key);
    if (!Number.isInteger(id) || !KNOWN_IDS.has(id) || !STAGES.includes(stage as Stage)) {
      valid = false;
      continue;
    }
    tracking[id] = stage as Stage;
  }
  return { tracking, valid };
}

function parseDocs(value: unknown): { docs: DocumentId[]; valid: boolean } {
  if (!Array.isArray(value)) return { docs: [], valid: false };
  const docs: DocumentId[] = [];
  let valid = true;
  for (const item of value) {
    if (typeof item !== 'string' || !KNOWN_DOCS.has(item)) {
      valid = false;
      continue;
    }
    const doc = item as DocumentId;
    if (!docs.includes(doc)) docs.push(doc);
  }
  return { docs, valid };
}

export function parsePersisted(raw: unknown): LoadResult {
  if (!isRecord(raw)) return { data: {}, status: 'recovered' };
  let recovered = raw.schemaVersion !== undefined && raw.schemaVersion !== SCHEMA_VERSION;
  const data: Partial<PersistedData> = {};

  const profile = parseProfile(raw.profile);
  if (profile !== null) data.profile = profile;
  else recovered = true;

  const tracking = parseTracking(raw.tracking);
  data.tracking = tracking.tracking;
  recovered ||= !tracking.valid;

  const docs = parseDocs(raw.readyDocs);
  data.readyDocs = docs.docs;
  recovered ||= !docs.valid;

  if (raw.theme === 'dark' || raw.theme === 'light') data.theme = raw.theme;
  else recovered = true;

  return { data, status: recovered ? 'recovered' : 'loaded' };
}

export function loadPersisted(): LoadResult {
  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    return withStatus({ data: {}, status: 'unavailable' });
  }
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return withStatus({ data: {}, status: 'unavailable' });
  }
  if (raw === null) return withStatus({ data: {}, status: 'empty' });
  try {
    return withStatus(parsePersisted(JSON.parse(raw)));
  } catch {
    return withStatus({ data: {}, status: 'recovered' });
  }
}

export function savePersisted(state: PersistedData): boolean {
  const payload: PersistedData & { schemaVersion: number } = {
    schemaVersion: SCHEMA_VERSION,
    profile: state.profile,
    tracking: state.tracking,
    readyDocs: state.readyDocs,
    theme: state.theme,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (currentStatus === 'unavailable') publishStatus('loaded');
    return true;
  } catch {
    publishStatus('unavailable');
    return false;
  }
}

export function clearPersisted(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    publishStatus('empty');
    return true;
  } catch {
    publishStatus('unavailable');
    return false;
  }
}
