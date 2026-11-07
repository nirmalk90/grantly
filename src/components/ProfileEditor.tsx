import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppActions, useAppState } from '../state/AppState';
import { useCatalog } from '../state/CatalogContext';
import { cleanText } from '../lib/sanitize';
import { parsePersisted } from '../state/storage';
import { exportBackup } from '../lib/export';
import { Modal } from './Modal';
import { Button } from './ui';
import type { Category, Gender, Level, Profile } from '../types';
import { CATEGORIES, CATEGORY_LABELS, GENDERS, GENDER_LABELS, LEVELS, PROFILE_LIMITS, STATES } from '../data/profile';
export function ProfileEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useAppState(); const { dispatch, notify, clearSavedData } = useAppActions(); const { scholarships } = useCatalog(); const navigate = useNavigate();
  const [draft, setDraft] = useState<Profile>(state.profile); const [error, setError] = useState(''); const [confirmClear, setConfirmClear] = useState(false); const [confirmDemo, setConfirmDemo] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  const update = <K extends keyof Profile>(key: K, value: Profile[K]): void => setDraft((d) => ({ ...d, [key]: value }));
  const optionalNumber = (value: string): number | null => value === '' ? null : Number(value);
  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const p: Profile = { ...draft, name: cleanText(draft.name, 60), interests: cleanText(draft.interests, 140), complete: true };
    if (p.income === null || p.marks === null || p.state === '' || p.category === 'All' || p.gender === 'Unspecified' || p.disability === null || p.minority === null) { setError('Complete the eligibility fields before saving. Your name and interests are optional.'); return; }
    dispatch({ type: 'set-profile', profile: p }); notify('Profile saved — matches refreshed'); onClose();
  };
  const importBackup = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return;
    try {
      if (file.size > 200_000) throw new Error('Backup files must be smaller than 200 KB.');
      const result = parsePersisted(JSON.parse(await file.text()), new Set(scholarships.map((s) => s.id)));
      if (result.status !== 'loaded' || result.data.profile === undefined) throw new Error('This is not a complete, valid Grantly v3 backup.');
      dispatch({ type: 'restore', data: result.data as import('../types').PersistedData }); notify('Backup restored. Local document files are not included in backups.'); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this backup.'); }
    if (fileRef.current !== null) fileRef.current.value = '';
  };
  return <Modal open={open} titleId="profile-title" onClose={onClose}><form onSubmit={submit}>
    <p className="eyebrow">Private by design</p><h2 id="profile-title" className="dialog-title">Your student profile</h2><p className="dialog-sub">Used for eligibility screening on this device. Stored unencrypted in this browser. Name and interests are optional; never enter Aadhaar, bank numbers or passwords.</p>
    <div className="form-grid">
      <label>Preferred name (optional)<input aria-label="Preferred name (optional)" value={draft.name} maxLength={60} autoComplete="off" placeholder="How should we greet you?" onChange={(e) => update('name', e.target.value)} /></label>
      <label>Study level<select aria-label="Study level" value={draft.level} onChange={(e) => update('level', e.target.value as Level)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
      <label>Category<select aria-label="Category" value={draft.category} onChange={(e) => update('category', e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></label>
      <label>Annual family income (₹)<input aria-label="Annual family income (₹)" required type="number" inputMode="numeric" min={0} max={50_000_000} value={draft.income ?? ''} onChange={(e) => update('income', optionalNumber(e.target.value))} /></label>
      <label>Last marks (%)<input aria-label="Last marks (%)" required type="number" inputMode="decimal" min={0} max={100} step="any" value={draft.marks ?? ''} onChange={(e) => update('marks', optionalNumber(e.target.value))} /></label>
      <label>State / UT<select aria-label="State / UT" required value={draft.state} onChange={(e) => update('state', e.target.value)}><option value="">Select your state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Gender<select aria-label="Gender" required value={draft.gender} onChange={(e) => update('gender', e.target.value as Gender)}>{GENDERS.map((g) => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}</select></label>
      <label>Benchmark disability (40%+)<select aria-label="Benchmark disability (40%+)" required value={draft.disability === null ? '' : draft.disability ? 'yes' : 'no'} onChange={(e) => update('disability', e.target.value === '' ? null : e.target.value === 'yes')}><option value="">Select status</option><option value="no">No</option><option value="yes">Yes</option></select></label>
      <label>Notified minority community<select aria-label="Notified minority community" required value={draft.minority === null ? '' : draft.minority ? 'yes' : 'no'} onChange={(e) => update('minority', e.target.value === '' ? null : e.target.value === 'yes')}><option value="">Select status</option><option value="no">No</option><option value="yes">Yes</option></select></label>
      <label className="form-full">Interests & goals (optional)<input value={draft.interests} maxLength={PROFILE_LIMITS.interestsMaxLength} placeholder="e.g. computer science, design, community work" onChange={(e) => update('interests', e.target.value)} /></label>
    </div>
    {error !== '' && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions"><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit">Save profile</Button></div>
    <section className="privacy-tools" aria-labelledby="privacy-title"><h3 id="privacy-title">Your data, your choice</h3><p className="panel-note">Backups contain profile and planning data, not document files. Import replaces your current planner data.</p>
      <div className="dialog-action-group"><Button small onClick={() => { exportBackup(state); notify('Backup downloaded — keep it somewhere safe'); }}>Export backup</Button><Button small onClick={() => fileRef.current?.click()}>Import backup</Button><input ref={fileRef} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Import Grantly backup" onChange={(e) => { void importBackup(e.target.files?.[0]); }} />
      <Button small onClick={() => { if (Object.keys(state.tracking).length === 0 || confirmDemo) { dispatch({ type: 'load-demo' }); notify('Explicit demo loaded. Clear saved data to return to your own workspace.'); onClose(); navigate('/applications'); } else { setConfirmDemo(true); setError('Loading the demo replaces your profile and planner. Click “Replace with demo” to confirm, or export a backup first.'); } }}>{confirmDemo ? 'Replace with demo' : 'Try a demo'}</Button></div>
      {confirmClear ? <div className="confirm-panel"><p>Delete your profile, applications, notes, reminders, checklist and local document files from this browser? This cannot be undone.</p><div className="dialog-action-group"><Button small onClick={() => setConfirmClear(false)}>Keep my data</Button><Button small variant="danger" onClick={() => { void clearSavedData(); onClose(); }}>Delete all local data</Button></div></div> : <Button small variant="danger" onClick={() => setConfirmClear(true)}>Clear saved data</Button>}
    </section>
  </form></Modal>;
}
