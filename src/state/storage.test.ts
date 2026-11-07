import { describe, expect, it, vi } from 'vitest';
import { DEMO_PRESET, INITIAL_STATE } from './defaults';
import { getStorageStatusSnapshot, loadPersisted, parsePersisted, savePersisted, STORAGE_KEY } from './storage';
const ids = new Set([4, 5]);
describe('persisted state validation', () => {
  it('accepts a complete versioned payload', () => { const r = parsePersisted({ schemaVersion: 3, ...DEMO_PRESET }, ids); expect(r.status).toBe('loaded'); expect(r.data.profile?.name).toBe('Demo student'); });
  it('recovers malformed values and rejects unknown IDs', () => { const r = parsePersisted({ schemaVersion: 3, ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile, name: null }, tracking: { 999: 'bogus', 5: 'saved' }, readyDocs: ['Unknown', 'Aadhaar', 'Aadhaar'] }, ids); expect(r.status).toBe('recovered'); expect(r.data.profile).toBeUndefined(); expect(r.data.tracking).toEqual({ 5: 'saved' }); expect(r.data.readyDocs).toEqual(['Aadhaar']); });
  it('round-trips through localStorage', () => { expect(savePersisted({ ...INITIAL_STATE, theme: 'light' })).toBe(true); expect(loadPersisted(ids).data.theme).toBe('light'); expect(localStorage.getItem(STORAGE_KEY)).toContain('"schemaVersion":3'); });
  it('migrates profile/theme but never fictional v2 tracking', () => { localStorage.setItem('grantly.v2', JSON.stringify({ schemaVersion: 2, profile: { ...DEMO_PRESET.profile, name: 'Real student' }, tracking: { 5: 'submitted' }, theme: 'dark' })); const r = loadPersisted(ids); expect(r.data.profile?.name).toBe('Real student'); expect(r.data.tracking).toBeUndefined(); expect(r.status).toBe('recovered'); });
  it('reports unavailable storage', () => { vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); expect(savePersisted(INITIAL_STATE)).toBe(false); expect(getStorageStatusSnapshot()).toBe('unavailable'); });
});
