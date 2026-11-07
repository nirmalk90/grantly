import { useApp } from '../state/AppState';
import { evaluate } from '../lib/match';
import { daysUntil, formatDate, formatInr } from '../lib/dates';
import { SCHOLARSHIPS } from '../data/scholarships';
import { Modal } from './Modal';
import { Button, MatchRing, Tag } from './ui';

interface Props {
  scholarshipId: number | null;
  onClose: () => void;
}

export function DetailsModal({ scholarshipId, onClose }: Props) {
  const { state, dispatch, notify } = useApp();
  const s = SCHOLARSHIPS.find((item) => item.id === scholarshipId);
  if (s === undefined) return null;
  const ev = evaluate(s, state.profile, state.readyDocs);
  const tracked = state.tracking[s.id] !== undefined;

  return (
    <Modal open={scholarshipId !== null} titleId="details-title" onClose={onClose} wide>
      <p className="eyebrow">
        {s.org} · {s.kind}
      </p>
      <div className="details-head">
        <h2 id="details-title" className="dialog-title">
          {s.name}
        </h2>
        <MatchRing score={ev.score} size={58} />
      </div>
      <p className="dialog-sub">{s.about}</p>

      <div className="award-strip">
        <div>
          <strong>{s.amount}</strong>
          <small>Potential award value</small>
        </div>
        <Tag tone={ev.eligible ? 'good' : 'warn'}>
          {ev.eligible ? `Strong match · ${ev.score}%` : 'Review criteria'}
        </Tag>
      </div>

      <h3 className="dialog-h">Eligibility snapshot</h3>
      <dl className="criteria">
        <div>
          <dt>Study level</dt>
          <dd>{s.levels.join(', ')}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{s.categories.join(', ')}</dd>
        </div>
        <div>
          <dt>Family income</dt>
          <dd>{s.incomeCap > 900_000_000 ? 'No published cap' : `≤ ${formatInr(s.incomeCap)}`}</dd>
        </div>
        <div>
          <dt>Minimum marks</dt>
          <dd>{s.minMarks > 0 ? `${s.minMarks}%` : 'Not specified'}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{s.state === 'All' ? 'All India' : s.state}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>
            {formatDate(s.deadline).full} ({daysUntil(s.deadline)} days left)
          </dd>
        </div>
      </dl>

      {ev.gaps.length > 0 && (
        <p className="gap-note" role="note">
          Where you may not qualify: {ev.gaps.join('; ')}.
        </p>
      )}

      <h3 className="dialog-h">
        Documents to prepare · {ev.docsReady}/{ev.docsRequired} ready
      </h3>
      <ul className="doc-checklist">
        {s.docs.map((doc) => {
          const ready = state.readyDocs.includes(doc);
          return (
            <li key={doc}>
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={() => dispatch({ type: 'toggle-doc', doc })}
                />
                <span>{doc}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <h3 className="dialog-h">Suggested next steps</h3>
      <ol className="steps">
        <li>Confirm current eligibility and dates on the official scheme portal.</li>
        <li>Gather the documents above and check names/details match your application.</li>
        <li>Complete the official application form and save your acknowledgement.</li>
      </ol>

      <div className="dialog-actions">
        {s.applyUrl !== '' && (
          <a
            href={s.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-subtle"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            Official portal ↗
          </a>
        )}
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="primary"
          onClick={() => {
            if (!tracked) {
              dispatch({ type: 'track', id: s.id });
              notify('Saved to your application pipeline');
            }
            onClose();
            dispatch({ type: 'navigate', page: 'applications' });
          }}
        >
          {tracked ? 'Open tracker' : 'Save & track this'}
        </Button>
      </div>
    </Modal>
  );
}
