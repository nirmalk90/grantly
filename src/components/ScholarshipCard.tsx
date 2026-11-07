import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Evaluation, Scholarship } from '../types';
import { daysUntil, deadlineLabel, formatDate } from '../lib/dates';
import { useAppActions, useAppState } from '../state/AppState';
import { Button, MatchRing, Tag } from './ui';
export const ScholarshipCard = memo(function ScholarshipCard({ scholarship: s, evaluation: ev, onDetails }: { scholarship: Scholarship; evaluation: Evaluation; onDetails: (id: number) => void }) {
  const state = useAppState(); const { dispatch, notify } = useAppActions(); const navigate = useNavigate();
  const days = daysUntil(s.deadline); const tracked = state.tracking[s.id] !== undefined;
  return <article className="card">
    <div className="card-top"><span className={`org-logo tone-${s.tone}`} aria-hidden="true">{s.initials}</span><div className="card-title"><p className="org">{s.org}</p><h3><a className="scholarship-link" href={`/scholarships/${s.slug}`} onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); onDetails(s.id); } }}>{s.name}</a></h3></div><MatchRing score={ev.score} /></div>
    <div className="card-meta"><strong className="amount">{s.awardLabel}</strong><Tag>{s.fundingType === 'loan' ? 'Repayable loan' : s.kind}</Tag><Tag>{s.levels.join(' · ')}</Tag><Tag tone={days >= 0 && days <= 14 ? 'warn' : 'neutral'}>{deadlineLabel(days)}</Tag></div>
    <ul className="card-reasons">{(ev.gaps.length > 0 ? ev.gaps : ev.unknowns.length > 0 ? ev.unknowns : ev.reasons).slice(0, 3).map((r) => <li key={r} className={ev.gaps.length > 0 ? 'gap' : ''}>{r}</li>)}<li>{ev.docsReady}/{ev.docsRequired} documents marked ready</li></ul>
    <div className="card-foot"><span className="source-caption">Source checked {formatDate(s.verifiedAt).full}</span><div className="card-actions">
      <Button small onClick={() => onDetails(s.id)} aria-label={`View details for ${s.name}`}>Details</Button>
      <Button small variant={tracked ? 'subtle' : 'primary'} aria-pressed={tracked} aria-label={tracked ? `Open tracker for ${s.name}` : `Save & track ${s.name}`} onClick={() => { if (tracked) navigate('/applications'); else { dispatch({ type: 'track', id: s.id }); notify('Saved to your application pipeline'); } }}>{tracked ? 'Saved ✓' : 'Save & track'}</Button>
    </div></div>
  </article>;
});
