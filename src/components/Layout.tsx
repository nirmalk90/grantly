import { useApp } from '../state/AppState';
import type { Page } from '../types';
import { PAGE_LABELS } from '../lib/pages';
import {
  BellIcon,
  BookIcon,
  ClockIcon,
  CommandIcon,
  FileIcon,
  GridIcon,
  MoonIcon,
  SearchIcon,
  SparkIcon,
  SunIcon,
} from './icons';

interface NavItem {
  page: Page;
  label: string;
  icon: JSX.Element;
}

export function Sidebar({
  onOpenGuide,
  onReplayJourney,
}: {
  onOpenGuide: () => void;
  onReplayJourney?: () => void;
}) {
  const { state, dispatch, notify } = useApp();
  const items: NavItem[] = [
    { page: 'overview', label: PAGE_LABELS.overview, icon: <GridIcon /> },
    { page: 'discover', label: PAGE_LABELS.discover, icon: <SearchIcon /> },
    { page: 'assistant', label: PAGE_LABELS.assistant, icon: <SparkIcon /> },
    { page: 'applications', label: PAGE_LABELS.applications, icon: <BookIcon /> },
    { page: 'deadlines', label: PAGE_LABELS.deadlines, icon: <ClockIcon /> },
    { page: 'vault', label: PAGE_LABELS.vault, icon: <FileIcon /> },
  ];
  const tracked = Object.keys(state.tracking).length;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brandmark" aria-hidden="true">
          g
        </span>
        <span className="brand-text">
          grant<em>ly</em>
        </span>
      </div>
      <p className="side-label" id="nav-label">
        Workspace
      </p>
      <nav aria-labelledby="nav-label" className="nav">
        {items.map((item) => (
          <button
            key={item.page}
            type="button"
            className={state.page === item.page ? 'active' : ''}
            aria-current={state.page === item.page ? 'page' : undefined}
            onClick={() => dispatch({ type: 'navigate', page: item.page })}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.page === 'applications' && tracked > 0 && <span className="nav-count">{tracked}</span>}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        {onReplayJourney && (
          <button type="button" className="replay-journey" onClick={onReplayJourney}>
            <span aria-hidden="true">✳</span> Replay the voyage
          </button>
        )}
        <button
          type="button"
          className="replay-journey"
          onClick={() => {
            dispatch({ type: 'load-demo' });
            notify('Loaded demo student profile & pipeline');
          }}
          title="Load pre-filled sample student profile and active pipeline"
        >
          <span aria-hidden="true">★</span> Load demo preset
        </button>
        <div className="help-card">
          <strong>Application guide</strong>
          <p>A calm four-step playbook from discovery to funding.</p>
          <button type="button" onClick={onOpenGuide}>
            Explore the guide
          </button>
        </div>
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">
            {state.profile.name.charAt(0)}
          </span>
          <span className="user-meta">
            <strong>{state.profile.name}</strong>
            <small>Student account</small>
          </span>
        </div>
      </div>
      <span className="visually-hidden">
        <CommandIcon />
      </span>
    </aside>
  );
}

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { state, dispatch } = useApp();
  return (
    <header className="topbar">
      <p className="crumb">
        Workspace <span aria-hidden="true">/</span> <strong>{PAGE_LABELS[state.page]}</strong>
      </p>
      <div className="top-actions">
        <button type="button" className="palette-hint" onClick={onOpenPalette} aria-keyshortcuts="Control+K Meta+K">
          <SearchIcon />
          <span>Quick actions</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => dispatch({ type: 'toggle-theme' })}
        >
          {state.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <span className="dot" aria-hidden="true" />
          <BellIcon />
        </button>
      </div>
    </header>
  );
}
