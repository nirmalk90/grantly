import { useCallback, useEffect, useRef, useState } from 'react';
import { DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import type { Universe } from './engine';
import './journey.css';

interface JourneyProps {
  onEnter: () => void;
}

interface Chapter {
  readonly id: string;
  readonly label: string;
  /** Scroll progress at which this chapter becomes active. */
  readonly at: number;
}

const CHAPTERS: readonly Chapter[] = [
  { id: 'act-ignition', label: 'Ignition', at: 0 },
  { id: 'act-drift', label: 'Drift', at: 0.19 },
  { id: 'act-orbit', label: 'Orbit', at: 0.39 },
  { id: 'act-galaxy', label: 'Galaxy', at: 0.59 },
  { id: 'act-launch', label: 'Launch', at: 0.8 },
];

function scrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/**
 * The "New Era" cinematic voyage: a fixed WebGL canvas beneath five
 * scroll-choreographed acts. All narrative text is real, semantic DOM so it
 * stays readable by screen readers and works without WebGL.
 */
export default function Journey({ onEnter }: JourneyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const reducedRef = useRef(false);
  const [chapter, setChapter] = useState(0);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let universe: Universe | null = null;
    let cancelled = false;

    import('./engine')
      .then((mod) => {
        if (cancelled) return;
        universe = mod.createUniverse(canvas, { reducedMotion: reducedRef.current });
        if (!universe) {
          setFallback(true);
          return;
        }
        universe.setProgress(scrollProgress());
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    const onScroll = (): void => {
      const p = scrollProgress();
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (universe) universe.setProgress(p);
      let idx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        const c = CHAPTERS[i];
        if (c && p >= c.at) idx = i;
      }
      setChapter((prev) => (prev === idx ? prev : idx));
    };

    const onPointer = (e: PointerEvent): void => {
      if (!universe) return;
      universe.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('in-view', entry.isIntersecting);
        }
      },
      { threshold: 0.25 },
    );
    for (const act of document.querySelectorAll<HTMLElement>('.act')) {
      observer.observe(act);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    onScroll();

    return () => {
      cancelled = true;
      if (universe) universe.destroy();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      observer.disconnect();
    };
  }, []);

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reducedRef.current ? 'auto' : 'smooth' });
  }, []);

  const jumpTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedRef.current ? 'auto' : 'smooth', block: 'start' });
  }, []);

  return (
    <div className={fallback ? 'journey journey--static' : 'journey'}>
      <a className="journey-skip" href="#act-launch">
        Skip the voyage
      </a>

      <div className="journey-progress" aria-hidden="true">
        <div className="journey-progress-line" ref={lineRef} />
      </div>

      <header className="journey-hud">
        <div className="journey-brand">
          <span className="journey-mark" aria-hidden="true">
            ✳
          </span>
          <span>
            grant<em>ly</em>
          </span>
          <span className="journey-chip">NEW ERA</span>
        </div>
        <nav className="journey-chapters" aria-label="Voyage chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={i === chapter ? 'is-active' : undefined}
              aria-current={i === chapter ? 'step' : undefined}
              onClick={() => jumpTo(c.id)}
            >
              <span className="dot" aria-hidden="true" />
              <span className="label">{c.label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="journey-enter" onClick={onEnter}>
          Enter workspace <span aria-hidden="true">→</span>
        </button>
      </header>

      <canvas ref={canvasRef} className="journey-canvas" aria-hidden="true" />
      <div className="journey-vignette" aria-hidden="true" />

      <div className="journey-track">
        <section className="act act--center" id="act-ignition" aria-labelledby="h-ignition">
          <div className="act-inner">
            <p className="act-kicker">Act I · Ignition</p>
            <h1 id="h-ignition" className="act-title">
              One student.
              <br />
              <span className="grad">One spark.</span>
            </h1>
            <p className="act-body">
              Every funded future begins as a single point of light — one quiet question: <em>what if I could?</em>
            </p>
            <p className="act-hint">
              <span className="hint-line" aria-hidden="true" />
              Scroll to begin the voyage
            </p>
          </div>
        </section>

        <section className="act act--left" id="act-drift" aria-labelledby="h-drift">
          <div className="act-inner">
            <p className="act-kicker kicker-blue">Act II · Drift</p>
            <h2 id="h-drift" className="act-title">
              Ten thousand chances,
              <br />
              <span className="grad-blue">drifting in the dark.</span>
            </h2>
            <p className="act-body">
              Scholarships scatter across portals, PDFs and noticeboards — impossible to see at once, easy to miss
              entirely.
            </p>
          </div>
        </section>

        <section className="act act--right" id="act-orbit" aria-labelledby="h-orbit">
          <div className="act-inner">
            <p className="act-kicker">Act III · Orbit</p>
            <h2 id="h-orbit" className="act-title">
              Grantly pulls them <span className="grad">into orbit.</span>
            </h2>
            <p className="act-body">
              Level, category, income, marks, state — five honest answers, and the noise quietly aligns around you.
              Every match arrives with the reason why.
            </p>
          </div>
        </section>

        <section className="act act--center" id="act-galaxy" aria-labelledby="h-galaxy">
          <div className="act-inner">
            <p className="act-kicker kicker-blue">Act IV · Galaxy</p>
            <h2 id="h-galaxy" className="act-title">
              A galaxy that <span className="grad-mix">moves with you.</span>
            </h2>
            <p className="act-body">
              Matches, deadlines, documents and applications — one luminous system, endlessly reshaping itself as your
              story changes.
            </p>
          </div>
        </section>

        <section className="act act--center" id="act-launch" aria-labelledby="h-launch">
          <div className="act-inner act-card">
            <p className="act-kicker">Act V · Launch</p>
            <h2 id="h-launch" className="act-title">
              Your <span className="grad">new era</span> starts here.
            </h2>
            <p className="act-body">
              Step inside the workspace: personalized matches, an AI assistant, an application pipeline, a deadline
              radar and a document vault — all private, all yours.
            </p>
            <div className="act-cta">
              <button type="button" className="cta-primary" onClick={onEnter}>
                Enter your workspace <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="cta-ghost" onClick={replay}>
                Replay the voyage
              </button>
            </div>
            <ul className="act-stats" aria-label="What waits inside">
              <li>
                <b>{SCHOLARSHIPS.length}</b> curated schemes
              </li>
              <li>
                <b>{DOCUMENTS.length}</b>-document vault
              </li>
              <li>
                <b>AI</b> application assistant
              </li>
            </ul>
          </div>
        </section>

        <footer className="journey-foot">
          Grantly · New Era — a cinematic scholarship voyage. Schemes and figures shown inside are illustrative
          samples.
        </footer>
      </div>
    </div>
  );
}
