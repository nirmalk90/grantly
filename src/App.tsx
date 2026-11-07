import { Suspense, lazy, useCallback, useState } from 'react';
import Journey from './cinema/Journey';

const Workspace = lazy(() => import('./Workspace'));

function BootFallback() {
  return (
    <div className="boot-fallback" role="status" aria-label="Loading workspace">
      <h1>Grantly</h1>
      <p>Preparing your workspace…</p>
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
    <Suspense fallback={<BootFallback />}>
      <Workspace onReplayJourney={replayJourney} />
    </Suspense>
  );
}
