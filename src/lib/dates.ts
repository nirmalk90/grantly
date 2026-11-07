const DAY_MS = 86_400_000;

/** Whole days from today until an ISO date (end of the deadline day counts). */
export function daysUntil(isoDate: string, from: Date = new Date()): number {
  const end = new Date(`${isoDate}T23:59:59`);
  return Math.ceil((end.getTime() - from.getTime()) / DAY_MS);
}

export function formatDate(isoDate: string): { day: string; month: string; full: string } {
  const d = new Date(`${isoDate}T00:00:00`);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString('en', { month: 'short' }),
    full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

export function formatInr(value: number): string {
  if (value >= 100_000) {
    const lakhs = value / 100_000;
    return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}
