import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PROFILE } from './defaults';
import { getStorageStatusSnapshot, loadPersisted, parsePersisted, savePersisted, STORAGE_KEY } from './storage';

describe('persisted state validation', () => {
  it('accepts a valid versioned payload', () => {
    const result = parsePersisted({
      schemaVersion: 2,
      profile: INITIAL_PROFILE,
      tracking: { 5: 'saved' },
      readyDocs: ['Aadhaar'],
      theme: 'dark',
    });
    expect(result.status).toBe('loaded');
    expect(result.data.profile?.name).toBe(INITIAL_PROFILE.name);
  });

  it('recovers from malformed profile, tracking, and document values', () => {
    const result = parsePersisted({
      schemaVersion: 2,
      profile: { ...INITIAL_PROFILE, name: null },
      tracking: { 999: 'bogus', 5: 'saved' },
      readyDocs: ['Unknown document', 'Aadhaar', 'Aadhaar'],
      theme: 'dark',
    });
    expect(result.status).toBe('recovered');
    expect(result.data.profile).toBeUndefined();
    expect(result.data.tracking).toEqual({ 5: 'saved' });
    expect(result.data.readyDocs).toEqual(['Aadhaar']);
  });

  it('round-trips through localStorage', () => {
    expect(savePersisted({ profile: INITIAL_PROFILE, tracking: {}, readyDocs: [], theme: 'light' })).toBe(true);
    const loaded = loadPersisted();
    expect(loaded.status).toBe('loaded');
    expect(loaded.data.theme).toBe('light');
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"schemaVersion":2');
  });

  it('reports unavailable storage without crashing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(savePersisted({ profile: INITIAL_PROFILE, tracking: {}, readyDocs: [], theme: 'dark' })).toBe(false);
    expect(getStorageStatusSnapshot()).toBe('unavailable');
  });
});
