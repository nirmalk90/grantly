/** Clamp free-text input to a safe length and strip control characters. */
export function cleanText(value: string, maxLength = 200, preserveNewlines = false): string {
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 200;
  // eslint-disable-next-line no-control-regex -- intentional: strip C0/C1 control characters from free text
  const stripped = preserveNewlines ? value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '') : value.replace(/[\u0000-\u001F\u007F]/g, '');
  return stripped.trimStart().slice(0, limit);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Runtime guard for records persisted in localStorage. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
