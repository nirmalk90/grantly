import { useNavigate } from 'react-router-dom';
import { useAppActions, useAppState } from '../state/AppState';
import { useCatalog } from '../state/CatalogContext';
import { evaluate } from '../lib/match';
import { daysUntil, deadlineLabel, formatDate, formatInr } from '../lib/dates';
import { Modal } from './Modal';
import { Button, MatchRing, Tag } from './ui';
export function DetailsModal({ scholarshipId, onClose }: { scholarshipId: number | null; onClose: () => void }) {
  const state = useAppState(); const { dispatch, notify } = useAppActions(); const { scholarships } = useCatalog(); const navigate = useNavigate();
  const s = scholarships.find((item) => item.id === scholarshipId); if (s === undefined) return null;
  const ev = evaluate(s, state.profile, state.readyDocs); const tracked = state.tracking[s.id] !== undefined;
  return <Modal open titleId="details-title" onClose={onClose} wide>
    <p className="eyebrow">{s.org} · {s.kind}</p><div className="details-head"><h2 id="details-title" className="dialog-title">{s.name}</h2><MatchRing score={ev.score} size={58} /></div><p className="dialog-sub">{s.about}</p>
    <div className="award-strip"><div><strong>{s.awardLabel}</strong><small>{s.fundingType === 'loan' ? 'Loan principal — must be repaid' : 'Published award / allowance'}</small></div><Tag tone={ev.eligible ? 'good' : 'warn'}>{ev.eligible ? 'Profile criteria match' : 'Review eligibility'}</Tag></div>
    <h3 className="dialog-h">Eligibility snapshot</h3><dl className="criteria">
      <div><dt>Study level</dt><dd>{s.levels.join(', ')}</dd></div><div><dt>Category</dt><dd>{s.categories.join(', ')}</dd></div>
      <div><dt>Family income</dt><dd>{s.incomeCap === null ? 'See official guidelines' : `Up to ${formatInr(s.incomeCap)}`}</dd></div><div><dt>Minimum marks</dt><dd>{s.minMarks === null ? 'No simple percentage cutoff modelled' : `${s.minMarks}%`}</dd></div>
      <div><dt>Location</dt><dd>{s.state === 'All' ? 'All India; scheme conditions apply' : s.state === 'NER' ? 'North Eastern Region; domicile and Class XII school conditions apply' : s.state}</dd></div><div><dt>Application type</dt><dd>{s.applicationType}</dd></div>
      <div><dt>Official deadline</dt><dd>{formatDate(s.deadline).full} · {deadlineLabel(daysUntil(s.deadline))}</dd></div><div><dt>Source checked</dt><dd>{formatDate(s.verifiedAt).full}</dd></div>
    </dl><p className="panel-note">{s.deadlineNote} Dates use Asia/Kolkata calendar days; the provider may specify a cutoff time.</p>
    {ev.gaps.length > 0 && <p className="gap-note">Profile mismatches: {ev.gaps.join('; ')}.</p>}{ev.unknowns.length > 0 && <p className="gap-note">To complete screening: {ev.unknowns.join('; ')}.</p>}
    <h3 className="dialog-h">Additional conditions to verify</h3><ul className="condition-list">{s.conditions.map((c) => <li key={c}>{c}</li>)}</ul>
    <h3 className="dialog-h">Preparation checklist · {ev.docsReady}/{ev.docsRequired} ready</h3><p className="panel-note">A planning aid, not the provider’s definitive upload list. Check the official guidelines.</p><ul className="doc-checklist">{s.docs.map((doc) => <li key={doc}><label className="check-line"><input type="checkbox" checked={state.readyDocs.includes(doc)} onChange={() => dispatch({ type: 'toggle-doc', doc })} /><span>{doc}</span></label></li>)}</ul>
    <div className="source-box"><strong>Official sources</strong><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">Scheme listing / announcement ↗<span className="visually-hidden"> (opens in a new tab)</span></a>{s.guidelinesUrl !== null && <a href={s.guidelinesUrl} target="_blank" rel="noopener noreferrer">Published scheme guidelines ↗<span className="visually-hidden"> (opens in a new tab)</span></a>}<p>Matching is not an award decision. Institution, admission year, domicile and other rules may require manual verification.</p></div>
    <div className="dialog-actions"><a href={s.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-subtle">Official application portal ↗<span className="visually-hidden"> (opens in a new tab)</span></a><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={() => { if (!tracked) { dispatch({ type: 'track', id: s.id }); notify('Saved to your application pipeline'); } onClose(); navigate('/applications'); }}>{tracked ? 'Open tracker' : 'Save & track this'}</Button></div>
  </Modal>;
}
