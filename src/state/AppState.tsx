import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Action, AppState } from '../types';
import { INITIAL_STATE } from './defaults';
import { createAppReducer } from './reducer';
import { useCatalog } from './CatalogContext';
import { clearPersisted, getStorageStatusSnapshot, loadPersisted, savePersisted, subscribeStorageStatus } from './storage';
import type { StorageStatus } from './storage';
import { clearDocuments } from '../services/documents';

export interface Toast { id: number; message: string }
interface AppActions { dispatch: Dispatch<Action>; notify: (message: string) => void; storageStatus: StorageStatus; clearSavedData: () => Promise<void> }
const StateContext = createContext<AppState | null>(null);
const ActionsContext = createContext<AppActions | null>(null);
const ToastContext = createContext<Toast | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const { scholarships } = useCatalog();
  const ids = useMemo(() => new Set(scholarships.map((s) => s.id)), [scholarships]);
  const [loaded] = useState(() => loadPersisted(ids));
  const reducer = useMemo(() => createAppReducer(ids), [ids]);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (base): AppState => ({ ...base, ...loaded.data }));
  const storageStatus = useSyncExternalStore(subscribeStorageStatus, getStorageStatusSnapshot, getStorageStatusSnapshot);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);
  const toastId = useRef(0);
  const notify = useCallback((message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastId.current += 1; setToast({ id: toastId.current, message });
    toastTimer.current = window.setTimeout(() => { setToast(null); toastTimer.current = null; }, 4000);
  }, []);
  useEffect(() => () => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); }, []);
  const { profile, tracking, readyDocs, theme, notes, reminders, tourSeen } = state;
  useEffect(() => { savePersisted({ profile, tracking, readyDocs, theme, notes, reminders, tourSeen }); }, [profile, tracking, readyDocs, theme, notes, reminders, tourSeen]);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#03060e' : '#f4f6fb'); }, [theme]);
  const clearSavedData = useCallback(async () => {
    const localCleared = clearPersisted();
    dispatch({ type: 'clear-data' });
    try { await clearDocuments(); notify(localCleared ? 'Profile, applications, checklist and local files cleared' : 'Session cleared; browser storage could not be accessed'); }
    catch { notify('Profile cleared, but local files could not be removed. Delete them in the Vault.'); }
  }, [notify]);
  const actions = useMemo<AppActions>(() => ({ dispatch, notify, storageStatus, clearSavedData }), [notify, storageStatus, clearSavedData]);
  return <StateContext.Provider value={state}><ActionsContext.Provider value={actions}><ToastContext.Provider value={toast}>{children}</ToastContext.Provider></ActionsContext.Provider></StateContext.Provider>;
}
export function useAppState(): AppState { const c = useContext(StateContext); if (c === null) throw new Error('useAppState requires AppProvider'); return c; }
export function useAppActions(): AppActions { const c = useContext(ActionsContext); if (c === null) throw new Error('useAppActions requires AppProvider'); return c; }
export function useToast(): Toast | null { return useContext(ToastContext); }
