import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppState';
import { cleanText } from '../lib/sanitize';
import { SCHOLARSHIPS } from '../data/scholarships';
import type { Page } from '../types';
import { PAGE_LABELS } from '../lib/pages';
import { SearchIcon } from './icons';

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
  const { state, dispatch, notify } = useApp();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const nav: PaletteItem[] = PAGES.map((page) => ({
      id: `page-${page}`,
      label: `Go to ${PAGE_LABELS[page]}`,
      hint: 'Navigate',
      run: () => dispatch({ type: 'navigate', page }),
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
        label: 'Load demo student preset (sample profile & pipeline)',
        hint: 'Demo',
        run: () => {
          dispatch({ type: 'load-demo' });
          notify('Loaded demo student profile & pipeline');
        },
      },
      {
        id: 'reset-demo',
        label: 'Reset data to initial default state',
        hint: 'Demo',
        run: () => {
          dispatch({ type: 'reset-demo' });
          notify('Reset to default initial state');
        },
      },
      ...SCHOLARSHIPS.filter((s) => state.tracking[s.id] === undefined).map((s) => ({
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
  }, [query, state.theme, state.tracking, dispatch, notify, onOpenProfile, onOpenGuide]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const runItem = (item: PaletteItem | undefined) => {
    if (item === undefined) return;
    item.run();
    onClose();
  };

  const activeId = items[active]?.id;

  return (
    <div className="palette-root" role="presentation">
      <button type="button" className="modal-backdrop" aria-label="Close command palette" onClick={onClose} tabIndex={-1} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input-row">
          <SearchIcon />
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: palette is a focus-first surface
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeId !== undefined ? `palette-opt-${activeId}` : undefined}
            aria-label="Type a command or search"
            placeholder="Type a command or search scholarships…"
            value={query}
            onChange={(e) => setQuery(cleanText(e.target.value, 80))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                runItem(items[active]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {items.length === 0 && <p className="palette-empty">No matching actions</p>}
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              id={`palette-opt-${item.id}`}
              role="option"
              aria-selected={i === active}
              className={`palette-item ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => runItem(item)}
            >
              <span>{item.label}</span>
              <span className="palette-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
