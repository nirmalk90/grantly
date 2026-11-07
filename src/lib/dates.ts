const DAY_MS = 86_400_000;

/** Scholarship deadlines in this demo are interpreted in Indian Standard Time. */
export const SCHEME_TIME_ZONE = 'Asia/Kolkata';

function parseIsoDate(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const check = new Date(timestamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return timestamp;
}

export function todayKeyInTimeZone(from: Date = new Date(), timeZone: string = SCHEME_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(from);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const timestamp = parseIsoDate(isoDate);
  if (timestamp === null) return isoDate;
  return new Date(timestamp + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Calendar days remaining in the scheme timezone.
 * 0 means the scheme closes today; negative values mean it has closed.
 */
export function daysUntil(isoDate: string, from: Date = new Date(), timeZone: string = SCHEME_TIME_ZONE): number {
  const deadline = parseIsoDate(isoDate);
  const today = parseIsoDate(todayKeyInTimeZone(from, timeZone));
  if (deadline === null || today === null) return Number.NaN;
  return Math.round((deadline - today) / DAY_MS);
}

export function deadlineLabel(days: number): string {
  if (!Number.isFinite(days) || days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${days} days left`;
}

export function formatDate(isoDate: string, timeZone: string = SCHEME_TIME_ZONE): { day: string; month: string; full: string } {
  const timestamp = parseIsoDate(isoDate);
  const d = new Date(timestamp === null ? Date.UTC(1970, 0, 1) : timestamp + DAY_MS / 2);
  return {
    day: String(new Intl.DateTimeFormat('en', { timeZone, day: 'numeric' }).format(d)),
    month: new Intl.DateTimeFormat('en', { timeZone, month: 'short' }).format(d),
    full: new Intl.DateTimeFormat('en-IN', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(d),
  };
}

export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100_000) {
    const lakhs = value / 100_000;
    return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function greeting(from: Date = new Date(), timeZone: string = SCHEME_TIME_ZONE): string {
  const hour = Number(
    new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hour12: false }).format(from),
  );
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
