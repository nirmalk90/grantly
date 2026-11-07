import { useEffect, useState } from 'react';
import { useApp } from '../state/AppState';
import { cleanText, clampNumber } from '../lib/sanitize';
import { Modal } from './Modal';
import { Button } from './ui';
import type { Category, Gender, Level, Profile } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LEVELS: Level[] = ['UG', 'PG', 'Diploma'];
const CATEGORIES: Category[] = ['All', 'SC', 'ST', 'OBC', 'EWS'];
const STATES = [
  'Andhra Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other',
];

export function ProfileEditor({ open, onClose }: Props) {
  const { state, dispatch, notify } = useApp();
  const [draft, setDraft] = useState<Profile>(state.profile);

  useEffect(() => {
    if (open) {
      setDraft(state.profile);
    }
  }, [open, state.profile]);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned: Profile = {
      ...draft,
      name: cleanText(draft.name, 60) || 'Student',
      interests: cleanText(draft.interests, 140),
      income: clampNumber(Math.round(draft.income), 0, 50_000_000),
      marks: clampNumber(Math.round(draft.marks), 0, 100),
    };
    dispatch({ type: 'set-profile', profile: cleaned });
    notify('Profile updated — matches refreshed');
    onClose();
  };

  return (
    <Modal open={open} titleId="profile-title" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="eyebrow">Personalise your matches</p>
        <h2 id="profile-title" className="dialog-title">
          Your student profile
        </h2>
        <p className="dialog-sub">
          Used only to explain scholarship eligibility. Stored locally on this device.
        </p>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={draft.name}
              maxLength={60}
              autoComplete="name"
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
          <label>
            Study level
            <select value={draft.level} onChange={(e) => update('level', e.target.value as Level)}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={draft.category} onChange={(e) => update('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Annual family income (₹)
            <input
              type="number"
              min={0}
              max={50_000_000}
              value={draft.income}
              onChange={(e) => update('income', Number(e.target.value))}
            />
          </label>
          <label>
            Last marks (%)
            <input
              type="number"
              min={0}
              max={100}
              value={draft.marks}
              onChange={(e) => update('marks', Number(e.target.value))}
            />
          </label>
          <label>
            State
            <select value={draft.state} onChange={(e) => update('state', e.target.value)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Gender
            <select value={draft.gender} onChange={(e) => update('gender', e.target.value as Gender)}>
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </label>
          <label className="form-full">
            Interests & goals (used by the AI assistant)
            <input
              value={draft.interests}
              maxLength={140}
              placeholder="e.g. computer science, design, community work"
              onChange={(e) => update('interests', e.target.value)}
            />
          </label>
        </div>
        <div className="dialog-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              small
              type="button"
              onClick={() => {
                dispatch({ type: 'load-demo' });
                notify('Loaded demo student profile & pipeline');
                onClose();
              }}
              title="Preload a sample student profile with tracked applications"
            >
              ★ Load demo preset
            </Button>
            <Button
              small
              type="button"
              onClick={() => {
                dispatch({ type: 'reset-demo' });
                notify('Reset to default initial state');
                onClose();
              }}
              title="Reset profile and tracker"
            >
              Reset
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit">
              Save profile
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
