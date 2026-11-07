const DAY_MS = 86_400_000;
export const SCHEME_TIME_ZONE = 'Asia/Kolkata';

function parseIsoDate(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match === null) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const check = new Date(timestamp);
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? timestamp : null;
}
export function isIsoDate(value: string): boolean { return parseIsoDate(value) !== null; }
export function todayKeyInTimeZone(from: Date = new Date(), timeZone = SCHEME_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(from);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const timestamp = parseIsoDate(isoDate);
  return timestamp === null ? isoDate : new Date(timestamp + days * DAY_MS).toISOString().slice(0, 10);
}
/** Null is unknown, not closed. Countdown uses calendar days, not elapsed 24-hour periods. */
export function daysUntil(isoDate: string | null, from: Date = new Date(), timeZone = SCHEME_TIME_ZONE): number {
  if (isoDate === null) return Number.NaN;
  const deadline = parseIsoDate(isoDate), today = parseIsoDate(todayKeyInTimeZone(from, timeZone));
  return deadline === null || today === null ? Number.NaN : Math.round((deadline - today) / DAY_MS);
}
export function deadlineLabel(days: number): string {
  if (Number.isNaN(days)) return 'Check official dates';
  if (!Number.isFinite(days) || days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${days} days left`;
}
export function formatDate(isoDate: string | null, timeZone = SCHEME_TIME_ZONE): { day: string; month: string; full: string } {
  if (isoDate === null) return { day: '—', month: '', full: 'Not verified — check official portal' };
  const timestamp = parseIsoDate(isoDate);
  if (timestamp === null) return { day: '—', month: '', full: 'Invalid date' };
  const d = new Date(timestamp + DAY_MS / 2);
  return {
    day: new Intl.DateTimeFormat('en', { timeZone, day: 'numeric' }).format(d),
    month: new Intl.DateTimeFormat('en', { timeZone, month: 'short' }).format(d),
    full: new Intl.DateTimeFormat('en-IN', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(d),
  };
}
export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value >= 100_000 ? `₹${Number.isInteger(value / 100_000) ? value / 100_000 : (value / 100_000).toFixed(1)}L` : `₹${value.toLocaleString('en-IN')}`;
}
export function greeting(from: Date = new Date(), timeZone = SCHEME_TIME_ZONE): string {
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hour12: false }).format(from));
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

/** A local catalogue is not a live feed. Prompt a re-check after 30 days. */
export function isCatalogStale(verifiedAt: string, now = new Date()): boolean {
  const age = daysUntil(verifiedAt, now);
  return !Number.isNaN(age) && age < -30;
}
