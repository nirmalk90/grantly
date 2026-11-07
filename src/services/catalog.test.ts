import type { Scholarship } from '../types';
import { describe, expect, it, vi, afterEach } from 'vitest';
import raw from '../../public/data/scholarships.json';
import { parseCatalog, findScholarship, DOCUMENTS } from './catalog';
import { testScholarships } from '../test/fixtures';
const actual = await vi.importActual<typeof import('./catalog')>('./catalog');
const clone = () => structuredClone(raw) as unknown as { schemaVersion: number; scholarships: [Record<string, unknown>, Record<string, unknown>, ...Record<string, unknown>[]] };
describe('catalogue contract and provenance', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('accepts the real catalogue with unique stable identities and HTTPS sources', () => {
    expect(testScholarships).toHaveLength(15);
    expect(new Set(testScholarships.map(s => s.id)).size).toBe(15);
    expect(new Set(testScholarships.map(s => s.slug)).size).toBe(15);
    for (const s of testScholarships) { expect(s.sourceUrl).toMatch(/^https:/); expect(s.verifiedAt).toBe('2026-11-07'); expect(s.docs.every(d => DOCUMENTS.includes(d))).toBe(true); }
  });
  it('does not invent a CSSS date when official sources conflict', () => { const s = findScholarship(testScholarships, 1) as Scholarship; expect(s.deadline).toBeNull(); expect(s.deadlineNote).toContain('conflict'); expect(s.requiresAbove80Percentile).toBe(true); });
  it.each(['id', 'slug', 'name', 'sourceUrl', 'verifiedAt', 'conditions', 'docs'])('rejects missing or invalid %s', (key) => { const data = clone(); (data.scholarships[0] as unknown as Record<string, unknown>)[key] = key === 'id' ? -1 : key === 'conditions' || key === 'docs' ? ['x'.repeat(1001)] : ''; expect(() => parseCatalog(data)).toThrow(); });
  it('rejects duplicate ids, slugs, unsafe links and impossible dates', () => {
    const [first, second] = testScholarships;
    if (!first || !second) throw new Error("Fixture missing");
    let data = clone(); data.scholarships[1].id = first.id; expect(() => parseCatalog(data)).toThrow();
    data = clone(); data.scholarships[1].slug = first.slug; expect(() => parseCatalog(data)).toThrow();
    data = clone(); data.scholarships[0].applyUrl = 'javascript:alert(1)'; expect(() => parseCatalog(data)).toThrow();
    data = clone(); data.scholarships[0].deadline = '2026-02-30'; expect(() => parseCatalog(data)).toThrow();
    expect(() => parseCatalog({ ...clone(), schemaVersion: 2 })).toThrow();
  });
  it('loads through the replaceable repository and surfaces network / HTTP failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => raw })); await expect(actual.catalogRepository.load()).resolves.toHaveProperty('schemaVersion', 1);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 })); await expect(actual.catalogRepository.load()).rejects.toThrow('503');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline'))); await expect(actual.catalogRepository.load()).rejects.toThrow('offline');
  });
});
