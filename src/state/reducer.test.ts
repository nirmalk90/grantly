import { describe, expect, it } from 'vitest';
import type { DocumentId } from '../types';
import { INITIAL_STATE } from './defaults';
import { appReducer } from './reducer';

describe('app reducer', () => {
  it('ignores unknown scholarships, stages, and documents', () => {
    expect(appReducer(INITIAL_STATE, { type: 'track', id: 999 })).toBe(INITIAL_STATE);
    expect(appReducer(INITIAL_STATE, { type: 'move', id: 5, stage: 'saved' })).toBe(INITIAL_STATE);
    expect(appReducer(INITIAL_STATE, { type: 'toggle-doc', doc: 'Unknown' as DocumentId })).toBe(INITIAL_STATE);
  });

  it('tracks, moves, and untracks known scholarships', () => {
    const tracked = appReducer(INITIAL_STATE, { type: 'track', id: 5 });
    expect(tracked.tracking[5]).toBe('saved');
    const moved = appReducer(tracked, { type: 'move', id: 5, stage: 'submitted' });
    expect(moved.tracking[5]).toBe('submitted');
    expect(appReducer(moved, { type: 'untrack', id: 5 }).tracking[5]).toBeUndefined();
  });

  it('clears saved data and resets demo defaults', () => {
    const dirty = appReducer(appReducer(INITIAL_STATE, { type: 'track', id: 5 }), { type: 'toggle-doc', doc: 'Aadhaar' });
    const cleared = appReducer(dirty, { type: 'clear-data' });
    expect(cleared.tracking).toEqual({});
    expect(cleared.readyDocs).toEqual([]);
    const reset = appReducer(cleared, { type: 'reset-demo' });
    expect(reset.readyDocs.length).toBeGreaterThan(0);
  });
});
