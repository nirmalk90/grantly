import type { Action, AppState, Stage } from '../types';
import { DEFAULT_READY_DOCS, DEMO_PRESET, DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import { INITIAL_STATE } from './defaults';

const KNOWN_IDS = new Set(SCHOLARSHIPS.map((s) => s.id));

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, page: action.page };
    case 'set-query':
      return { ...state, query: action.query };
    case 'set-filter':
      return { ...state, filter: action.filter };
    case 'set-sort':
      return { ...state, sort: action.sort };
    case 'set-profile':
      return { ...state, profile: action.profile };
    case 'track':
      if (!KNOWN_IDS.has(action.id) || state.tracking[action.id] !== undefined) return state;
      return { ...state, tracking: { ...state.tracking, [action.id]: 'saved' } };
    case 'untrack':
      return {
        ...state,
        tracking: Object.fromEntries(
          Object.entries(state.tracking).filter(([id]) => Number(id) !== action.id),
        ) as Record<number, Stage>,
      };
    case 'move':
      if (state.tracking[action.id] === undefined) return state;
      return { ...state, tracking: { ...state.tracking, [action.id]: action.stage } };
    case 'toggle-doc':
      if (!DOCUMENTS.includes(action.doc)) return state;
      return {
        ...state,
        readyDocs: state.readyDocs.includes(action.doc)
          ? state.readyDocs.filter((d) => d !== action.doc)
          : [...state.readyDocs, action.doc],
      };
    case 'toggle-theme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'load-demo':
      return {
        ...state,
        profile: { ...DEMO_PRESET.profile },
        tracking: { ...DEMO_PRESET.tracking },
        readyDocs: [...DEMO_PRESET.readyDocs],
      };
    case 'reset-demo':
      return {
        ...state,
        profile: { ...INITIAL_STATE.profile },
        tracking: {},
        readyDocs: [...DEFAULT_READY_DOCS],
        query: '',
        filter: 'all',
        sort: 'best',
      };
    case 'clear-data':
      return {
        ...state,
        profile: { ...INITIAL_STATE.profile },
        tracking: {},
        readyDocs: [],
        query: '',
        filter: 'all',
        sort: 'best',
      };
    default:
      return state;
  }
}
