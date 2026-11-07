import type { PersistedData, Scholarship } from '../types';
import { downloadBlob } from '../services/documents';
import { todayKeyInTimeZone } from './dates';

/** Neutralize spreadsheet formulas while preserving RFC-style CSV quoting. */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^(?:\s*[=+\-@]|[\t\r])/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function applicationsCsv(scholarships: readonly Scholarship[], data: PersistedData): string {
  const rows: (string | number)[][] = [['Scholarship', 'Provider', 'Stage', 'Award', 'Funding type', 'Official deadline', 'Personal reminder', 'Notes', 'Official portal']];
  for (const s of scholarships) {
    const stage = data.tracking[s.id]; if (stage === undefined) continue;
    rows.push([s.name, s.org, stage, s.awardLabel, s.fundingType, s.deadline ?? 'Not verified', data.reminders[s.id] ?? '', data.notes[s.id] ?? '', s.applyUrl]);
  }
  return '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
export function exportApplications(scholarships: readonly Scholarship[], data: PersistedData): void {
  downloadBlob(new Blob([applicationsCsv(scholarships, data)], { type: 'text/csv;charset=utf-8' }), `grantly-applications-${todayKeyInTimeZone()}.csv`);
}
export function exportBackup(data: PersistedData): void {
  downloadBlob(new Blob([JSON.stringify({ schemaVersion: 3, ...data }, null, 2)], { type: 'application/json' }), `grantly-backup-${todayKeyInTimeZone()}.json`);
}
const icsEscape = (s: string): string => s.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n').replaceAll('\r', '');
const encoder = new TextEncoder();
function foldIcsLine(line: string): string {
  let result = '', current = '', bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) { result += current + '\r\n '; current = char; bytes = 1 + size; }
    else { current += char; bytes += size; }
  }
  return result + current;
}
const nextDay = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10).replaceAll('-', '');
export function calendarIcs(scholarships: readonly Scholarship[], reminders: Record<number, string>, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grantly//Scholarship planner//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Grantly deadlines'];
  for (const s of scholarships) {
    const date = reminders[s.id] ?? s.deadline; if (date === undefined || date === null) continue;
    lines.push('BEGIN:VEVENT', `UID:grantly-${s.id}@grantly.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${nextDay(date)}`, `SUMMARY:${icsEscape((reminders[s.id] !== undefined ? 'Prepare: ' : 'Deadline: ') + s.name)}`, `DESCRIPTION:${icsEscape(`Check the official portal before applying. ${s.applyUrl}`)}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Review your scholarship application', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR'); return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
export function exportCalendar(scholarships: readonly Scholarship[], reminders: Record<number, string>): void {
  downloadBlob(new Blob([calendarIcs(scholarships, reminders)], { type: 'text/calendar;charset=utf-8' }), 'grantly-deadlines.ics');
}
