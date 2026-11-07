import type { Action, AppState, Stage } from '../types';
import { DOCUMENTS } from '../services/catalog';
import { isIsoDate } from '../lib/dates';
import { cleanText } from '../lib/sanitize';
import { DEMO_PRESET, INITIAL_STATE } from './defaults';

const STAGES = ['saved', 'progress', 'submitted', 'awarded'];
export function createAppReducer(knownIds: ReadonlySet<number>) {
  return function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
      case 'set-profile': return { ...state, profile: action.profile };
      case 'track':
        if (!knownIds.has(action.id) || state.tracking[action.id] !== undefined) return state;
        return { ...state, tracking: { ...state.tracking, [action.id]: 'saved' } };
      case 'untrack': return {
        ...state,
        tracking: Object.fromEntries(Object.entries(state.tracking).filter(([id]) => Number(id) !== action.id)) as Record<number, Stage>,
        notes: Object.fromEntries(Object.entries(state.notes).filter(([id]) => Number(id) !== action.id)),
        reminders: Object.fromEntries(Object.entries(state.reminders).filter(([id]) => Number(id) !== action.id)),
      };
      case 'move':
        if (!knownIds.has(action.id) || state.tracking[action.id] === undefined || !STAGES.includes(action.stage)) return state;
        return { ...state, tracking: { ...state.tracking, [action.id]: action.stage } };
      case 'toggle-doc':
        if (!DOCUMENTS.includes(action.doc)) return state;
        return { ...state, readyDocs: state.readyDocs.includes(action.doc) ? state.readyDocs.filter((d) => d !== action.doc) : [...state.readyDocs, action.doc] };
      case 'set-note':
        if (state.tracking[action.id] === undefined) return state;
        return { ...state, notes: { ...state.notes, [action.id]: cleanText(action.note, 1000, true) } };
      case 'set-reminder':
        if (state.tracking[action.id] === undefined || (action.date !== '' && !isIsoDate(action.date))) return state;
        if (action.date === '') return { ...state, reminders: Object.fromEntries(Object.entries(state.reminders).filter(([id]) => Number(id) !== action.id)) };
        return { ...state, reminders: { ...state.reminders, [action.id]: action.date } };
      case 'toggle-theme': return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
      case 'see-tour': return { ...state, tourSeen: true };
      case 'load-demo': return { ...DEMO_PRESET, profile: { ...DEMO_PRESET.profile }, tracking: { ...DEMO_PRESET.tracking }, readyDocs: [...DEMO_PRESET.readyDocs], theme: state.theme };
      case 'restore': return { ...action.data, theme: state.theme };
      case 'clear-data': return { ...INITIAL_STATE, profile: { ...INITIAL_STATE.profile }, theme: state.theme, tourSeen: true };
      default: return state;
    }
  };
}
