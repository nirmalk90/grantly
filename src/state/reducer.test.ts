import { describe, expect, it } from 'vitest';
import type { DocumentId } from '../types';
import { INITIAL_STATE } from './defaults';
import { createAppReducer } from './reducer';
const appReducer = createAppReducer(new Set([4, 5]));
describe('app reducer', () => {
  it('ignores unknown scholarships, untracked moves and unknown documents', () => { expect(appReducer(INITIAL_STATE, { type: 'track', id: 999 })).toBe(INITIAL_STATE); expect(appReducer(INITIAL_STATE, { type: 'move', id: 5, stage: 'saved' })).toBe(INITIAL_STATE); expect(appReducer(INITIAL_STATE, { type: 'toggle-doc', doc: 'Unknown' as DocumentId })).toBe(INITIAL_STATE); });
  it('tracks, moves, annotates and removes applications', () => { let s = appReducer(INITIAL_STATE, { type: 'track', id: 5 }); s = appReducer(s, { type: 'move', id: 5, stage: 'submitted' }); s = appReducer(s, { type: 'set-note', id: 5, note: 'Reference 123\nFollow up' }); s = appReducer(s, { type: 'set-reminder', id: 5, date: '2026-11-20' }); expect(s.tracking[5]).toBe('submitted'); expect(s.notes[5]).toContain('\n'); expect(appReducer(s, { type: 'untrack', id: 5 }).notes[5]).toBeUndefined(); });
  it('clears data but preserves appearance', () => { const s = appReducer({ ...INITIAL_STATE, theme: 'dark' }, { type: 'clear-data' }); expect(s.tracking).toEqual({}); expect(s.profile.complete).toBe(false); expect(s.theme).toBe('dark'); });
});

describe('application notes, reminders and destructive actions', () => {
  const reduce = createAppReducer(new Set([1, 2]));
  it('cleans notes, validates reminders and removes dependent data on untrack', () => {
    let state = reduce(INITIAL_STATE, { type: 'track', id: 1 });
    state = reduce(state, { type: 'set-note', id: 1, note: 'hello\nworld' }); expect(state.notes[1]).toBe('hello\nworld');
    expect(reduce(state, { type: 'set-reminder', id: 1, date: '2026-02-30' })).toBe(state);
    state = reduce(state, { type: 'set-reminder', id: 1, date: '2026-12-01' });
    state = reduce(state, { type: 'untrack', id: 1 }); expect(state.notes[1]).toBeUndefined(); expect(state.reminders[1]).toBeUndefined();
  });
  it('requires a valid stage and keeps theme when loading or clearing explicit demo data', () => {
    const state = reduce(INITIAL_STATE, { type: 'track', id: 1 }); expect(reduce(state, { type: 'move', id: 1, stage: 'invalid' as never })).toBe(state);
    const demo = reduce({ ...state, theme: 'dark' }, { type: 'load-demo' }); expect(demo.theme).toBe('dark'); expect(demo.profile.name).toBe('Demo student');
    const cleared = reduce(demo, { type: 'clear-data' }); expect(cleared.tracking).toEqual({}); expect(cleared.profile.complete).toBe(false); expect(cleared.theme).toBe('dark');
  });
});
