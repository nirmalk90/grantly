import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatalogSnapshot, Scholarship } from '../types';
import { catalogRepository } from '../services/catalog';
import type { CatalogRepository } from '../services/catalog';
import { Button } from '../components/ui';

interface CatalogValue { catalog: CatalogSnapshot; scholarships: readonly Scholarship[]; refresh: () => void }
const Context = createContext<CatalogValue | null>(null);
export function CatalogProvider({ children, repository = catalogRepository }: { children: ReactNode; repository?: CatalogRepository }) {
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => { setError(false); setAttempt((n) => n + 1); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    repository.load(controller.signal).then((data) => { if (!controller.signal.aborted) setCatalog(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => window.clearTimeout(timeout));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [repository, attempt]);
  const value = useMemo(() => catalog === null ? null : { catalog, scholarships: catalog.scholarships, refresh }, [catalog, refresh]);
  if (error) return <main className="boot-fallback"><h1>Grantly</h1><p role="alert">The scholarship catalogue could not be loaded. Your saved profile has not been changed.</p><Button variant="primary" onClick={refresh}>Try again</Button></main>;
  if (value === null) return <main className="boot-fallback" role="status"><h1>Grantly</h1><p>Loading your scholarship workspace…</p></main>;
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCatalog(): CatalogValue {
  const value = useContext(Context);
  if (value === null) throw new Error('useCatalog requires CatalogProvider');
  return value;
}
