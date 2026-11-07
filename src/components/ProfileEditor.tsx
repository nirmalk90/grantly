import { useState } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { cleanText, clampNumber } from '../lib/sanitize';
import { Modal } from './Modal';
import { Button } from './ui';
import type { Category, Gender, Level, Profile } from '../types';
import { CATEGORIES, CATEGORY_LABELS, GENDERS, GENDER_LABELS, LEVELS, PROFILE_LIMITS, STATES } from '../data/profile';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProfileEditor({ open, onClose }: Props) {
  const state = useAppState();
  const { dispatch, notify, clearSavedData } = useAppActions();
  const [draft, setDraft] = useState<Profile>(state.profile);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]): void =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const cleaned: Profile = {
      ...draft,
      name: cleanText(draft.name, PROFILE_LIMITS.nameMaxLength) || 'Student',
      interests: cleanText(draft.interests, PROFILE_LIMITS.interestsMaxLength),
      income: clampNumber(Math.round(draft.income), PROFILE_LIMITS.incomeMin, PROFILE_LIMITS.incomeMax),
      marks: clampNumber(Math.round(draft.marks), PROFILE_LIMITS.marksMin, PROFILE_LIMITS.marksMax),
    };
    dispatch({ type: 'set-profile', profile: cleaned });
    notify('Profile updated — matches refreshed');
    onClose();
  };

  return (
    <Modal open={open} titleId="profile-title" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="eyebrow">Personalise your matches</p>
        <h2 id="profile-title" className="dialog-title">Your student profile</h2>
        <p className="dialog-sub">
          Used only to explain scholarship eligibility. Stored locally on this device, unencrypted. Use “Clear saved data” on shared devices.
        </p>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={draft.name}
              maxLength={PROFILE_LIMITS.nameMaxLength}
              autoComplete="name"
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
          <label>
            Study level
            <select value={draft.level} onChange={(e) => update('level', e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label>
            Category
            <select value={draft.category} onChange={(e) => update('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </label>
          <label>
            Annual family income (₹)
            <input
              type="number"
              inputMode="numeric"
              min={PROFILE_LIMITS.incomeMin}
              max={PROFILE_LIMITS.incomeMax}
              value={draft.income}
              onChange={(e) => update('income', Number(e.target.value))}
            />
          </label>
          <label>
            Last marks (%)
            <input
              type="number"
              inputMode="decimal"
              min={PROFILE_LIMITS.marksMin}
              max={PROFILE_LIMITS.marksMax}
              value={draft.marks}
              onChange={(e) => update('marks', Number(e.target.value))}
            />
          </label>
          <label>
            State
            <select value={draft.state} onChange={(e) => update('state', e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Gender
            <select value={draft.gender} onChange={(e) => update('gender', e.target.value as Gender)}>
              {GENDERS.map((g) => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
            </select>
          </label>
          <label className="form-full">
            Interests & goals (used by the local assistant)
            <input
              value={draft.interests}
              maxLength={PROFILE_LIMITS.interestsMaxLength}
              placeholder="e.g. computer science, design, community work"
              onChange={(e) => update('interests', e.target.value)}
            />
          </label>
        </div>
        <div className="dialog-actions dialog-actions-split">
          <div className="dialog-action-group">
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
                if (window.confirm('Reset profile, tracker and checklist to the initial demo defaults?')) {
                  dispatch({ type: 'reset-demo' });
                  notify('Reset to default initial state');
                  onClose();
                }
              }}
              title="Reset profile and tracker"
            >
              Reset
            </Button>
            <Button
              small
              type="button"
              variant="danger"
              onClick={() => {
                if (window.confirm('Clear saved profile, tracker and document checklist from this browser?')) {
                  clearSavedData();
                  onClose();
                }
              }}
            >
              Clear saved data
            </Button>
          </div>
          <div className="dialog-action-group">
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit">Save profile</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
