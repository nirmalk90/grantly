import { memo } from 'react';
import type { Evaluation, Scholarship } from '../types';
import { daysUntil, deadlineLabel } from '../lib/dates';
import { useAppActions, useAppState } from '../state/AppState';
import { Button, MatchRing, Tag } from './ui';

interface CardProps {
  scholarship: Scholarship;
  evaluation: Evaluation;
  onDetails: (id: number) => void;
}

export const ScholarshipCard = memo(function ScholarshipCard({ scholarship: s, evaluation: ev, onDetails }: CardProps) {
  const state = useAppState();
  const { dispatch, notify } = useAppActions();
  const days = daysUntil(s.deadline);
  const tracked = state.tracking[s.id] !== undefined;

  return (
    <article className="card">
      <div className="card-top">
        <span className={`org-logo tone-${s.tone}`} aria-hidden="true">{s.initials}</span>
        <div className="card-title">
          <p className="org">{s.org}</p>
          <h3>{s.name}</h3>
        </div>
        <MatchRing score={ev.score} />
      </div>

      <div className="card-meta">
        <strong className="amount">{s.amount}</strong>
        <Tag>{s.kind}</Tag>
        <Tag>{s.levels.join(' · ')}</Tag>
        <Tag tone={days >= 0 && days <= 14 ? 'warn' : 'neutral'}>{deadlineLabel(days)}</Tag>
      </div>

      <ul className="card-reasons">
        {(ev.eligible ? ev.reasons.slice(0, 3) : ev.gaps.slice(0, 2)).map((r) => (
          <li key={r} className={ev.eligible ? '' : 'gap'}>{r}</li>
        ))}
        <li>{ev.docsReady}/{ev.docsRequired} documents ready</li>
      </ul>

      <div className="card-actions">
        <Button small onClick={() => onDetails(s.id)} aria-label={`View details for ${s.name}`}>
          Details
        </Button>
        <Button
          small
          variant={tracked ? 'subtle' : 'primary'}
          aria-pressed={tracked}
          aria-label={tracked ? `Open tracker for ${s.name}` : `Save and track ${s.name}`}
          onClick={() => {
            if (tracked) {
              dispatch({ type: 'navigate', page: 'applications' });
            } else {
              dispatch({ type: 'track', id: s.id });
              notify('Saved to your application pipeline');
            }
          }}
        >
          {tracked ? 'Saved ✓' : 'Save & track'}
        </Button>
      </div>
    </article>
  );
});
