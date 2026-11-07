import type { Scholarship } from '../types';
import { describe, expect, it } from 'vitest';
import { applicationsCsv, calendarIcs, csvCell } from './export';
import { INITIAL_STATE } from '../state/defaults';
import { testScholarships } from '../test/fixtures';
describe('portable exports', () => {
  it('quotes CSV and neutralizes spreadsheet formulas including leading whitespace', () => { expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"'); for (const s of ['=1+1', '+cmd', '-cmd', '@SUM(A1)', '\t=1', '  =1+2']) expect(csvCell(s)).toContain("\"'"); });
  it('exports only tracked applications and preserves unknown dates', () => { const csv = applicationsCsv(testScholarships, { ...INITIAL_STATE, tracking: { 9: 'saved' }, notes: { 9: 'Ask provider' } }); expect(csv).toContain('Ask provider'); expect(csv).toContain('Not verified'); expect(csv).not.toContain('AICTE Pragati'); });
  it('emits all-day IST calendar dates, personal reminders and escaped descriptions', () => {
    const s = { ...testScholarships[0] as Scholarship, id: 99, name: 'A; B, C\\D', deadline: '2026-12-31' };
    const ics = calendarIcs([s], { 99: '2026-12-20' }, new Date('2026-11-07T00:00:00Z'));
    expect(ics).toContain('DTSTART;VALUE=DATE:20261220'); expect(ics).toContain('DTEND;VALUE=DATE:20261221'); expect(ics).toContain('A\\; B\\, C\\\\D'); expect(ics).toContain('TRIGGER:-P1D'); expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true); for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(calendarIcs([{ ...s, deadline: null }], {})).not.toContain('BEGIN:VEVENT');
  });
});
