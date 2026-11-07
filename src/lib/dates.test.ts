import { describe, expect, it } from 'vitest';
import { addDaysToIsoDate, daysUntil, deadlineLabel, formatDate, formatInr, todayKeyInTimeZone } from './dates';

describe('timezone-aware deadlines', () => {
  it('returns the same calendar-day countdown for the same instant in IST and UTC', () => {
    const instant = new Date('2026-11-07T00:30:00+05:30');
    expect(daysUntil('2026-11-07', instant)).toBe(0);
    expect(daysUntil('2026-11-07', new Date('2026-11-06T19:00:00Z'))).toBe(0);
  });

  it('labels today, tomorrow, and closed deadlines', () => {
    const from = new Date('2026-11-07T12:00:00+05:30');
    expect(daysUntil('2026-11-08', from)).toBe(1);
    expect(daysUntil('2026-11-06', from)).toBe(-1);
    expect(deadlineLabel(0)).toBe('Closes today');
    expect(deadlineLabel(1)).toBe('Closes tomorrow');
    expect(deadlineLabel(-1)).toBe('Closed');
    expect(deadlineLabel(5)).toBe('5 days left');
  });

  it('handles invalid dates and month boundaries', () => {
    expect(Number.isNaN(daysUntil('2026-02-30'))).toBe(true);
    expect(addDaysToIsoDate('2026-01-31', 1)).toBe('2026-02-01');
    expect(todayKeyInTimeZone(new Date('2026-11-06T19:00:00Z'))).toBe('2026-11-07');
  });

  it('formats dates and currency deterministically', () => {
    expect(formatDate('2026-11-07').full).toBe('7 November 2026');
    expect(formatInr(250_000)).toBe('₹2.5L');
    expect(formatInr(Number.NaN)).toBe('—');
  });
});
