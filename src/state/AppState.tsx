import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Action, AppState } from '../types';
import { INITIAL_STATE } from './defaults';
import { appReducer } from './reducer';
import {
  clearPersisted,
  getStorageStatusSnapshot,
  loadPersisted,
  savePersisted,
  subscribeStorageStatus,
} from './storage';

export interface Toast {
  id: number;
  message: string;
}

interface AppActions {
  dispatch: Dispatch<Action>;
  notify: (message: string) => void;
  storageStatus: ReturnType<typeof getStorageStatusSnapshot>;
  clearSavedData: () => void;
}

const StateContext = createContext<AppState | null>(null);
const ActionsContext = createContext<AppActions | null>(null);
const ToastContext = createContext<Toast | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadPersisted);
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, (base): AppState => ({
    ...base,
    ...loaded.data,
    page: 'overview',
  }));
  const storageStatus = useSyncExternalStore(
    subscribeStorageStatus,
    getStorageStatusSnapshot,
    getStorageStatusSnapshot,
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);
  const toastId = useRef(0);

  const notify = useCallback((message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastId.current += 1;
    setToast({ id: toastId.current, message });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  const { profile, tracking, readyDocs, theme } = state;
  useEffect(() => {
    savePersisted({ profile, tracking, readyDocs, theme });
  }, [profile, tracking, readyDocs, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const clearSavedData = useCallback(() => {
    clearPersisted();
    dispatch({ type: 'clear-data' });
    notify('Saved profile, tracker and checklist cleared');
  }, [notify]);

  const actions = useMemo<AppActions>(
    () => ({ dispatch, notify, storageStatus, clearSavedData }),
    [notify, storageStatus, clearSavedData],
  );

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (ctx === null) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsContext);
  if (ctx === null) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}

export function useToast(): Toast | null {
  return useContext(ToastContext);
}

/** Compatibility hook for consumers that genuinely need state, actions and toast. */
export function useApp(): AppState & AppActions & { toast: Toast | null } {
  return { ...useAppState(), ...useAppActions(), toast: useToast() };
}
