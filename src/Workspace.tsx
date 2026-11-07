import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider, useAppActions, useAppState, useToast } from './state/AppState';
import { Sidebar, Topbar } from './components/Layout';
import { CommandPalette } from './components/CommandPalette';
import { ProfileEditor } from './components/ProfileEditor';
import { DetailsModal } from './components/DetailsModal';
import { GuideModal } from './components/GuideModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DATA_NOTICE } from './data/scholarships';
import type { Page } from './types';
import './styles.css';

const Overview = lazy(() => import('./pages/Overview'));
const Discover = lazy(() => import('./pages/Discover'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Applications = lazy(() => import('./pages/Applications'));
const Deadlines = lazy(() => import('./pages/Deadlines'));
const Vault = lazy(() => import('./pages/Vault'));

type Overlay =
  | { type: 'palette' }
  | { type: 'profile' }
  | { type: 'guide' }
  | { type: 'details'; id: number }
  | null;

function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-label="Loading page">
      <span className="skeleton-head" />
      <span className="skeleton-block" />
      <span className="skeleton-block short" />
    </div>
  );
}

function StorageBanner() {
  const { storageStatus } = useAppActions();
  if (storageStatus !== 'recovered' && storageStatus !== 'unavailable') return null;
  return (
    <p className="storage-banner" role="status">
      {storageStatus === 'recovered'
        ? 'Some saved data was invalid and has been reset to safe defaults.'
        : 'Browser storage is unavailable; changes will last only for this session.'}
    </p>
  );
}

function Shell({ onReplayJourney }: { onReplayJourney: () => void }) {
  const state = useAppState();
  const toast = useToast();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const overlayOpen = overlay !== null;

  const closeOverlay = useCallback(() => setOverlay(null), []);
  const openPalette = useCallback(() => {
    setOverlay((prev) => (prev === null ? { type: 'palette' } : prev.type === 'palette' ? null : prev));
  }, []);
  const openProfile = useCallback(() => setOverlay({ type: 'profile' }), []);
  const openGuide = useCallback(() => setOverlay({ type: 'guide' }), []);
  const openDetails = useCallback((id: number) => setOverlay({ type: 'details', id }), []);

  useEffect(() => {
    const shell = shellRef.current;
    if (shell === null) return;
    if (overlayOpen) shell.setAttribute('inert', '');
    else shell.removeAttribute('inert');
  }, [overlayOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPalette]);

  const page = state.page;
  let content: JSX.Element;
  switch (page as Page) {
    case 'discover':
      content = <Discover onDetails={openDetails} onOpenProfile={openProfile} />;
      break;
    case 'assistant':
      content = <Assistant onDetails={openDetails} />;
      break;
    case 'applications':
      content = <Applications />;
      break;
    case 'deadlines':
      content = <Deadlines onDetails={openDetails} />;
      break;
    case 'vault':
      content = <Vault />;
      break;
    default:
      content = <Overview onDetails={openDetails} onOpenProfile={openProfile} />;
  }

  return (
    <>
      <div className="shell" ref={shellRef} aria-hidden={overlayOpen ? true : undefined}>
        <a href="#content" className="skip-link">Skip to main content</a>
        <Sidebar onOpenGuide={openGuide} onReplayJourney={onReplayJourney} />
        <div className="main-col">
          <Topbar onOpenPalette={openPalette} />
          <StorageBanner />
          <main id="content" className="content" tabIndex={-1}>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>{content}</Suspense>
            </ErrorBoundary>
            <footer className="footer-note">
              <p>{DATA_NOTICE}</p>
              <p>Grantly v{__APP_VERSION__} · a planning companion, not an official scholarship portal.</p>
            </footer>
          </main>
        </div>
      </div>

      {overlay?.type === 'palette' && (
        <CommandPalette open onClose={closeOverlay} onOpenProfile={openProfile} onOpenGuide={openGuide} />
      )}
      {overlay?.type === 'profile' && <ProfileEditor open onClose={closeOverlay} />}
      {overlay?.type === 'guide' && <GuideModal open onClose={closeOverlay} />}
      {overlay?.type === 'details' && <DetailsModal scholarshipId={overlay.id} onClose={closeOverlay} />}

      {toast !== null && (
        <div key={toast.id} className="toast" role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </>
  );
}

export default function Workspace({ onReplayJourney }: { onReplayJourney: () => void }) {
  return (
    <AppProvider>
      <Shell onReplayJourney={onReplayJourney} />
    </AppProvider>
  );
}
