import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAppActions, useAppState } from '../state/AppState';
import { PAGE_LABELS, PAGE_PATHS } from '../lib/pages';
import type { Page } from '../types';
import { BookIcon, ClockIcon, FileIcon, GridIcon, MoonIcon, SearchIcon, SparkIcon, SunIcon } from './icons';
const ICONS: Record<Page, JSX.Element> = { overview: <GridIcon />, discover: <SearchIcon />, assistant: <SparkIcon />, applications: <BookIcon />, deadlines: <ClockIcon />, vault: <FileIcon /> };
export function Sidebar({ onOpenGuide, onOpenProfile }: { onOpenGuide: () => void; onOpenProfile: () => void }) {
  const state = useAppState(); const tracked = Object.keys(state.tracking).length;
  return <aside className="sidebar">
    <Link to="/" className="brand"><span className="brandmark" aria-hidden="true">g</span><span className="brand-text">grant<em>ly</em></span></Link>
    <p className="side-label" id="nav-label">Your funding workspace</p>
    <nav aria-labelledby="nav-label" className="nav">{(Object.keys(PAGE_LABELS) as Page[]).map((page) => <NavLink key={page} to={PAGE_PATHS[page]} end={page === 'overview'} className={({ isActive }) => isActive ? 'active' : ''} aria-label={page === 'applications' && tracked > 0 ? `${PAGE_LABELS[page]}, ${tracked} tracked` : PAGE_LABELS[page]}>
      {ICONS[page]}<span>{PAGE_LABELS[page]}</span>{page === 'applications' && tracked > 0 && <span className="nav-count" aria-hidden="true">{tracked}</span>}
    </NavLink>)}</nav>
    <div className="side-bottom">
      <button type="button" className="replay-journey" onClick={onOpenProfile}><span aria-hidden="true">◎</span> Profile & privacy</button>
      <Link className="replay-journey" to="/tour"><span aria-hidden="true">✳</span> Explore the space tour</Link>
      <div className="help-card"><strong>From discovery to funding</strong><p>A practical four-step application playbook.</p><button type="button" onClick={onOpenGuide}>Explore the guide</button></div>
      <div className="user-chip"><span className="avatar" aria-hidden="true">{state.profile.name.charAt(0) || 'g'}</span><span className="user-meta"><strong>{state.profile.name || 'Your private workspace'}</strong><small>No account needed</small></span></div>
    </div>
  </aside>;
}
export function Topbar({ onOpenPalette, onOpenProfile }: { onOpenPalette: () => void; onOpenProfile: () => void }) {
  const state = useAppState(); const { dispatch } = useAppActions(); const { pathname } = useLocation();
  const page = (Object.keys(PAGE_PATHS) as Page[]).find((p) => PAGE_PATHS[p] === pathname) ?? 'overview';
  return <header className="topbar"><p className="crumb">Workspace <span aria-hidden="true">/</span> <strong>{PAGE_LABELS[page]}</strong></p><div className="top-actions">
    <span className="tag local-tag">On-device</span><button type="button" className="icon-btn profile-top-btn" aria-label="Profile and privacy" onClick={onOpenProfile}>◎</button>
    <button type="button" className="palette-hint" aria-label="Quick actions ⌘K" onClick={onOpenPalette} aria-keyshortcuts="Control+K Meta+K"><SearchIcon /><span>Quick actions</span><kbd aria-hidden="true">⌘K</kbd></button>
    <button type="button" className="icon-btn" aria-label={state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => dispatch({ type: 'toggle-theme' })}>{state.theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
    <Link to="/deadlines" className="icon-btn" aria-label="Deadline calendar"><ClockIcon /></Link>
  </div></header>;
}
