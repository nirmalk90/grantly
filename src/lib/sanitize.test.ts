import { describe, expect, it } from 'vitest';
import { clampNumber, cleanText, isFiniteNumber, isRecord } from './sanitize';

describe('sanitization', () => {
  it('strips control characters and clamps length', () => {
    expect(cleanText('a\u0000b\u001Fc\u007Fd')).toBe('abcd');
    expect(cleanText('  hello', 3)).toBe('hel');
  });

  it('guards finite numbers and records', () => {
    expect(clampNumber(Number.NaN, 0, 100)).toBe(0);
    expect(clampNumber(Infinity, 0, 100)).toBe(0);
    expect(clampNumber(150, 0, 100)).toBe(100);
    expect(isFiniteNumber('5')).toBe(false);
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});
