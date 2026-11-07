import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppActions, useAppState } from '../state/AppState';
import { useCatalog } from '../state/CatalogContext';
import { evaluate } from '../lib/match';
import { daysUntil, deadlineLabel } from '../lib/dates';
import { getTrackedByStage } from '../lib/selectors';
import { exportApplications, exportCalendar } from '../lib/export';
import { Button, Empty, PageHead, ProgressBar } from '../components/ui';
import type { Scholarship, Stage } from '../types';
const STAGES: { key: Stage; label: string }[] = [{ key: 'saved', label: 'Saved' }, { key: 'progress', label: 'In progress' }, { key: 'submitted', label: 'Submitted' }, { key: 'awarded', label: 'Awarded' }];
function Task({ scholarship: s, stage }: { scholarship: Scholarship; stage: Stage }) {
  const state = useAppState(); const { dispatch, notify } = useAppActions(); const ev = evaluate(s, state.profile, state.readyDocs);
  const [note, setNote] = useState(state.notes[s.id] ?? ''); const [remove, setRemove] = useState(false);
  return <article className="task"><p className="task-amt">{s.awardLabel}</p><h3><Link to={`/scholarships/${s.slug}`}>{s.name}</Link></h3><small>{s.org} · {deadlineLabel(daysUntil(s.deadline))}</small>
    <ProgressBar value={ev.docCompletion} label={`Documents ready for ${s.name}`} /><small>{ev.docsReady}/{ev.docsRequired} documents marked ready</small>
    <details className="task-details"><summary>Documents & application notes</summary><ul className="doc-checklist compact">{s.docs.map((doc) => <li key={doc}><label className="check-line"><input type="checkbox" checked={state.readyDocs.includes(doc)} onChange={() => dispatch({ type: 'toggle-doc', doc })} /><span>{doc}</span></label></li>)}</ul>
      <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'set-note', id: s.id, note }); notify('Application note saved'); }}><label className="field-label" htmlFor={`note-${s.id}`}>Notes / application reference</label><textarea id={`note-${s.id}`} className="control note-field" rows={3} maxLength={1000} value={note} placeholder="Keep reminders here, not passwords or OTPs." onChange={(e) => setNote(e.target.value)} /><Button small type="submit">Save note</Button></form>
      <label className="field-label" htmlFor={`reminder-${s.id}`}>Personal preparation date</label><input id={`reminder-${s.id}`} className="control" type="date" value={state.reminders[s.id] ?? ''} onChange={(e) => { dispatch({ type: 'set-reminder', id: s.id, date: e.target.value }); notify(e.target.value === '' ? 'Personal reminder removed' : 'Personal reminder saved on this device'); }} /><p className="panel-note">Shown in your workspace. Export to your calendar for device notifications.</p>
    </details>
    <div className="task-foot"><label><span className="visually-hidden">Move {s.name} to stage</span><select className="control" value={stage} onChange={(e) => { const next = e.target.value as Stage; dispatch({ type: 'move', id: s.id, stage: next }); notify(`Moved to ${STAGES.find((x) => x.key === next)?.label ?? next}`); }}>{STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}</select></label><a href={s.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-subtle btn-sm">Portal ↗<span className="visually-hidden"> for {s.name} (opens in a new tab)</span></a>
      {remove ? <div className="inline-confirm"><span>Remove this application and its notes?</span><Button small onClick={() => setRemove(false)}>Keep</Button><Button small variant="danger" onClick={() => { dispatch({ type: 'untrack', id: s.id }); notify('Application removed'); }}>Remove</Button></div> : <Button small variant="danger" aria-label={`Remove ${s.name} from tracker`} onClick={() => setRemove(true)}>Remove</Button>}
    </div></article>;
}
export default function Applications() {
  const state = useAppState(); const { scholarships } = useCatalog(); const { notify } = useAppActions(); const [mobileStage, setMobileStage] = useState<Stage>('saved');
  const byStage = getTrackedByStage(scholarships, state.tracking); const tracked = scholarships.filter((s) => state.tracking[s.id] !== undefined);
  return <><PageHead eyebrow="Stay on top of every step" title="Your application pipeline." actions={<div className="dialog-action-group"><Button disabled={tracked.length === 0} onClick={() => { exportApplications(scholarships, state); notify('Application CSV downloaded'); }}>Export CSV</Button><Button disabled={tracked.length === 0} onClick={() => { exportCalendar(tracked, state.reminders); notify('Calendar downloaded — import it for notifications'); }}>Export calendar</Button></div>}>Save, prepare, submit and celebrate. Move each application with its stage selector.</PageHead>
    {tracked.length === 0 ? <><Empty title="Your next opportunity starts here" hint="Save scholarships from Discover to build your pipeline. Add notes, preparation dates and document files as you go." /><div className="center-cta"><Link className="btn btn-primary" to="/discover">Find scholarships</Link></div></> : <>
      <div className="stage-switcher" role="group" aria-label="Choose application stage">{STAGES.map(({ key, label }) => <button key={key} type="button" className={`chip ${mobileStage === key ? 'is-active' : ''}`} aria-pressed={mobileStage === key} onClick={() => setMobileStage(key)}>{label} · {byStage[key].length}</button>)}</div>
      <div className="board" data-mobile-stage={mobileStage}>{STAGES.map(({ key, label }) => <section key={key} className="board-col" data-stage={key} aria-labelledby={`stage-${key}`}><div className="board-head"><h2 id={`stage-${key}`}>{label}</h2><span aria-label={`${byStage[key].length} applications`}>{byStage[key].length}</span></div>{byStage[key].length === 0 ? <p className="board-empty">Nothing here yet. Move an application to this stage when you are ready.</p> : byStage[key].map((s) => <Task key={s.id} scholarship={s} stage={key} />)}</section>)}</div>
    </>}
  </>;
}
