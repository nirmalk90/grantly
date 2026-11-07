import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Action, AppState, Stage } from '../types';
import { isRecord } from '../lib/sanitize';
import { DEFAULT_READY_DOCS, DEMO_PRESET } from '../data/scholarships';

const STORAGE_KEY = 'grantly.v2';

const initialState: AppState = {
  page: 'overview',
  profile: {
    name: 'Aditya Kumar',
    level: 'UG',
    category: 'All',
    income: 300_000,
    marks: 82,
    state: 'Bihar',
    gender: 'F',
    interests: 'computer science, AI, community work',
  },
  query: '',
  filter: 'all',
  sort: 'best',
  tracking: {},
  readyDocs: [...DEFAULT_READY_DOCS],
  theme: 'dark',
};

function readPersisted(): Partial<AppState> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: Partial<AppState> = {};
    if (isRecord(parsed.profile)) out.profile = { ...initialState.profile, ...parsed.profile };
    if (isRecord(parsed.tracking)) out.tracking = parsed.tracking as AppState['tracking'];
    if (Array.isArray(parsed.readyDocs) && parsed.readyDocs.every((d) => typeof d === 'string')) {
      out.readyDocs = parsed.readyDocs;
    }
    if (parsed.theme === 'dark' || parsed.theme === 'light') out.theme = parsed.theme;
    return out;
  } catch {
    return {};
  }
}

function reducer(state: AppState, action: Action): AppState {
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
      return state.tracking[action.id]
        ? state
        : { ...state, tracking: { ...state.tracking, [action.id]: 'saved' } };
    case 'untrack':
      return {
        ...state,
        tracking: Object.fromEntries(
          Object.entries(state.tracking).filter(([id]) => Number(id) !== action.id),
        ) as Record<number, Stage>,
      };
    case 'move':
      return { ...state, tracking: { ...state.tracking, [action.id]: action.stage } };
    case 'toggle-doc':
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
        profile: { ...initialState.profile },
        tracking: {},
        readyDocs: [...DEFAULT_READY_DOCS],
        query: '',
        filter: 'all',
        sort: 'best',
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  notify: (message: string) => void;
  toast: { id: number; message: string } | null;
}

const AppContext = createContext<AppContextValue | null>(null);

let toastId = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (base: AppState): AppState => ({ ...base, ...readPersisted(), page: 'overview' }),
  );
  const [toast, setToast] = useReducer(
    (_: { id: number; message: string } | null, next: { id: number; message: string } | null) => next,
    null,
  );

  const notify = useCallback((message: string) => {
    toastId += 1;
    setToast({ id: toastId, message });
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    const { profile, tracking, readyDocs, theme } = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tracking, readyDocs, theme }));
    } catch {
      /* storage may be unavailable; the app keeps working in memory */
    }
    document.documentElement.dataset.theme = theme;
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, notify, toast }), [state, notify, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
