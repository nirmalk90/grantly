import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './state/AppState';
import { Sidebar, Topbar } from './components/Layout';
import { CommandPalette } from './components/CommandPalette';
import { ProfileEditor } from './components/ProfileEditor';
import { DetailsModal } from './components/DetailsModal';
import { GuideModal } from './components/GuideModal';
import Journey from './cinema/Journey';
import type { Page } from './types';

const Overview = lazy(() => import('./pages/Overview'));
const Discover = lazy(() => import('./pages/Discover'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Applications = lazy(() => import('./pages/Applications'));
const Deadlines = lazy(() => import('./pages/Deadlines'));
const Vault = lazy(() => import('./pages/Vault'));

function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-label="Loading page">
      <span className="skeleton-head" />
      <span className="skeleton-block" />
      <span className="skeleton-block short" />
    </div>
  );
}

function Shell({ onReplayJourney }: { onReplayJourney: () => void }) {
  const { state } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const { toast } = useApp();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openGuide = useCallback(() => setGuideOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const page = state.page;
  let content: JSX.Element;
  switch (page as Page) {
    case 'discover':
      content = <Discover onDetails={setDetailsId} onOpenProfile={() => setProfileOpen(true)} />;
      break;
    case 'assistant':
      content = <Assistant onDetails={setDetailsId} />;
      break;
    case 'applications':
      content = <Applications />;
      break;
    case 'deadlines':
      content = <Deadlines onDetails={setDetailsId} />;
      break;
    case 'vault':
      content = <Vault />;
      break;
    default:
      content = <Overview onDetails={setDetailsId} onOpenProfile={() => setProfileOpen(true)} />;
  }

  return (
    <div className="shell">
      <a href="#content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar onOpenGuide={openGuide} onReplayJourney={onReplayJourney} />
      <div className="main-col">
        <Topbar onOpenPalette={openPalette} />
        <main id="content" className="content" tabIndex={-1}>
          <Suspense fallback={<PageFallback />}>{content}</Suspense>
          <footer className="footer-note">
            Grantly is a planning companion. Eligibility, dates and amounts are indicative samples — always confirm
            details on the official scheme portal before applying.
          </footer>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenGuide={openGuide}
      />
      <ProfileEditor open={profileOpen} onClose={() => setProfileOpen(false)} />
      <DetailsModal scholarshipId={detailsId} onClose={() => setDetailsId(null)} />
      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      {toast !== null && (
        <div key={toast.id} className="toast" role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<'journey' | 'workspace'>('journey');

  const enterWorkspace = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setMode('workspace');
  }, []);

  const replayJourney = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setMode('journey');
  }, []);

  if (mode === 'journey') {
    return <Journey onEnter={enterWorkspace} />;
  }

  return (
    <AppProvider>
      <Shell onReplayJourney={replayJourney} />
    </AppProvider>
  );
}
