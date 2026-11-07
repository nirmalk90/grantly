import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { cleanText } from '../lib/sanitize';
import { useCatalog } from '../state/CatalogContext';
import { useNavigate } from 'react-router-dom';
import { PAGE_PATHS } from '../lib/pages';
import type { Page } from '../types';
import { PAGE_LABELS } from '../lib/pages';
import { SearchIcon } from './icons';
import { useDialog } from './useDialog';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenGuide: () => void;
}

const PAGES: Page[] = ['overview', 'discover', 'assistant', 'applications', 'deadlines', 'vault'];

export function CommandPalette({ open, onClose, onOpenProfile, onOpenGuide }: Props) {
  const state = useAppState();
  const { dispatch, notify } = useAppActions(); const { scholarships } = useCatalog(); const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ open, onClose, panelRef, initialFocus: 'first' });

  const items = useMemo<PaletteItem[]>(() => {
    const nav: PaletteItem[] = PAGES.map((page) => ({
      id: `page-${page}`,
      label: `Go to ${PAGE_LABELS[page]}`,
      hint: 'Navigate',
      run: () => navigate(PAGE_PATHS[page]),
    }));
    const actions: PaletteItem[] = [
      { id: 'profile', label: 'Edit my student profile', hint: 'Profile', run: onOpenProfile },
      { id: 'guide', label: 'Open the application guide', hint: 'Guide', run: onOpenGuide },
      {
        id: 'theme',
        label: state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        hint: 'Appearance',
        run: () => dispatch({ type: 'toggle-theme' }),
      },
      {
        id: 'load-demo',
        label: 'Try a demo (replaces your local planner)',
        hint: 'Profile',
        run: () => {
          dispatch({ type: 'load-demo' });
          notify('Loaded demo student profile & pipeline');
        },
      },
      { id: 'privacy', label: 'Back up or clear saved data', hint: 'Privacy', run: onOpenProfile },
      ...scholarships.filter((s) => state.tracking[s.id] === undefined).map((s) => ({
        id: `save-${s.id}`,
        label: `Save “${s.name}”`,
        hint: 'Track',
        run: () => {
          dispatch({ type: 'track', id: s.id });
          notify('Saved to your application pipeline');
        },
      })),
    ];
    const all = [...nav, ...actions];
    const q = query.trim().toLowerCase();
    return q === '' ? all.slice(0, 9) : all.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 9);
  }, [query, state.theme, state.tracking, scholarships, dispatch, notify, navigate, onOpenProfile, onOpenGuide]);

  const activeId = items[active]?.id;

  useEffect(() => {
    if (activeId !== undefined) {
      document.getElementById(`palette-opt-${activeId}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeId]);

  if (!open) return null;

  const runItem = (item: PaletteItem | undefined): void => {
    if (item === undefined) return;
    onClose();
    item.run();
  };

  return (
    <div className="palette-root" role="presentation">
      <button type="button" className="modal-backdrop" aria-label="Close command palette" onClick={onClose} tabIndex={-1} />
      <div ref={panelRef} className="palette" role="dialog" aria-modal="true" aria-label="Command palette" tabIndex={-1}>
        <div className="palette-input-row">
          <SearchIcon />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={activeId !== undefined ? `palette-opt-${activeId}` : undefined}
            aria-label="Type a command or search"
            placeholder="Type a command or search scholarships…"
            value={query}
            onChange={(e) => {
              setQuery(cleanText(e.target.value, 80));
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.max(0, Math.min(a + 1, items.length - 1)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runItem(items[active]);
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list" id="palette-list" role="listbox" aria-label="Commands">
          {items.length === 0 && <p className="palette-empty" role="status">No matching actions</p>}
          {items.map((item, i) => (
            <div
              key={item.id}
              id={`palette-opt-${item.id}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={`palette-item ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => runItem(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  runItem(item);
                }
              }}
            >
              <span>{item.label}</span>
              <span className="palette-hint">{item.hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
