import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { useAppActions, useToast } from './state/AppState';
import { useCatalog } from './state/CatalogContext';
import { Sidebar, Topbar } from './components/Layout';
import { CommandPalette } from './components/CommandPalette';
import { ProfileEditor } from './components/ProfileEditor';
import { DetailsModal } from './components/DetailsModal';
import { GuideModal } from './components/GuideModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui';
import Overview from './pages/Overview';
import { PAGE_TITLES, PAGE_PATHS } from './lib/pages';
import { formatDate, isCatalogStale } from './lib/dates';
import type { Page } from './types';
const Discover = lazy(() => import('./pages/Discover'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Applications = lazy(() => import('./pages/Applications'));
const Deadlines = lazy(() => import('./pages/Deadlines'));
const Vault = lazy(() => import('./pages/Vault'));
type Overlay = { type: 'palette' | 'profile' | 'guide' } | { type: 'details'; id: number } | null;
function PageFallback() { return <div className="page-fallback" role="status" aria-label="Loading page"><span className="skeleton-head" /><span className="skeleton-block" /><span className="skeleton-block short" /></div>; }
function StorageBanner() {
  const { storageStatus } = useAppActions();
  if (storageStatus !== 'recovered' && storageStatus !== 'unavailable') return null;
  return <p className="storage-banner" role="status">{storageStatus === 'recovered' ? 'Some saved data was invalid or from an older version. Valid profile settings were kept; demo applications were not carried over.' : 'Browser storage is unavailable; changes will last only for this session.'}</p>;
}
function CatalogAgeBanner() {
  const { catalog, refresh } = useCatalog();
  if (!isCatalogStale(catalog.verifiedAt)) return null;
  return <div className="storage-banner" role="status"><span>This catalogue was last checked {formatDate(catalog.verifiedAt).full}. Re-check official portals; dates and rules may have changed.</span><Button small onClick={refresh}>Check for updates</Button></div>;
}
function Shell() {
  const toast = useToast(); const { catalog, scholarships } = useCatalog(); const navigate = useNavigate(); const location = useLocation();
  const detailMatch = useMatch('/scholarships/:slug');
  const [overlay, setOverlay] = useState<Overlay>(null); const shellRef = useRef<HTMLDivElement>(null); const mainRef = useRef<HTMLElement>(null);
  const routeScholarship = scholarships.find((s) => s.slug === detailMatch?.params.slug);
  const activeOverlay: Overlay = overlay ?? (routeScholarship ? { type: 'details', id: routeScholarship.id } : null);
  const overlayOpen = activeOverlay !== null;
  const closeOverlay = useCallback(() => { setOverlay(null); if (detailMatch !== null) navigate('/discover', { replace: true }); }, [detailMatch, navigate]);
  const openPalette = useCallback(() => { if (detailMatch !== null) navigate('/discover', { replace: true }); setOverlay((p) => p === null ? { type: 'palette' } : p.type === 'palette' ? null : p); }, [detailMatch, navigate]);
  const openProfile = useCallback(() => { if (detailMatch !== null) navigate('/discover', { replace: true }); setOverlay({ type: 'profile' }); }, [detailMatch, navigate]);
  const openGuide = useCallback(() => { if (detailMatch !== null) navigate('/discover', { replace: true }); setOverlay({ type: 'guide' }); }, [detailMatch, navigate]);
  const openDetails = useCallback((id: number) => setOverlay({ type: 'details', id }), []);
  const page = (Object.keys(PAGE_PATHS) as Page[]).find((p) => PAGE_PATHS[p] === location.pathname) ?? 'discover';
  useEffect(() => { document.title = `${PAGE_TITLES[page]} · Grantly`; window.scrollTo(0, 0); mainRef.current?.focus({ preventScroll: true }); }, [location.pathname, page]);
  useEffect(() => { const shell = shellRef.current; if (shell === null) return; if (overlayOpen) shell.setAttribute('inert', ''); else shell.removeAttribute('inert'); }, [overlayOpen]);
  useEffect(() => { const onKey = (e: KeyboardEvent): void => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [openPalette]);
  return <>
    <div className="shell" ref={shellRef} aria-hidden={overlayOpen ? true : undefined}>
      <a href="#content" className="skip-link">Skip to main content</a>
      <Sidebar onOpenGuide={openGuide} onOpenProfile={openProfile} />
      <div className="main-col"><Topbar onOpenPalette={openPalette} onOpenProfile={openProfile} /><StorageBanner /><CatalogAgeBanner />
        <main id="content" className="content" tabIndex={-1} ref={mainRef}>
          <ErrorBoundary key={location.pathname}><Suspense fallback={<PageFallback />}><Routes>
            <Route index element={<Overview onDetails={openDetails} onOpenProfile={openProfile} />} />
            <Route path="discover" element={<Discover onDetails={openDetails} onOpenProfile={openProfile} />} />
            <Route path="scholarships/:slug" element={routeScholarship ? <Discover onDetails={openDetails} onOpenProfile={openProfile} /> : <div className="empty"><h1>Scholarship not found</h1><p>This catalogue link may have changed.</p><Button onClick={() => navigate('/discover')}>Browse scholarships</Button></div>} />
            <Route path="assistant" element={<Assistant onDetails={openDetails} />} />
            <Route path="applications" element={<Applications />} />
            <Route path="deadlines" element={<Deadlines onDetails={openDetails} />} />
            <Route path="vault" element={<Vault />} />
            <Route path="*" element={<div className="empty"><h1>Page not found</h1><p>This link does not point to a workspace page.</p><Button onClick={() => navigate('/')}>Return to overview</Button></div>} />
          </Routes></Suspense></ErrorBoundary>
          <footer className="footer-note"><p>Source-linked catalogue checked {formatDate(catalog.verifiedAt).full}. Not a live feed. Verify current rules and dates on official portals before applying.</p><p>Grantly v{__APP_VERSION__} · Private, on-device planning. Not an official scholarship portal.</p></footer>
        </main>
      </div>
    </div>
    {activeOverlay?.type === 'palette' && <CommandPalette open onClose={closeOverlay} onOpenProfile={openProfile} onOpenGuide={openGuide} />}
    {activeOverlay?.type === 'profile' && <ProfileEditor open onClose={closeOverlay} />}
    {activeOverlay?.type === 'guide' && <GuideModal open onClose={closeOverlay} />}
    {activeOverlay?.type === 'details' && <DetailsModal scholarshipId={activeOverlay.id} onClose={closeOverlay} />}
    {toast !== null && <div key={toast.id} className="toast" role="status" aria-live="polite">{toast.message}</div>}
  </>;
}
export default function Workspace() { return <Shell />; }
