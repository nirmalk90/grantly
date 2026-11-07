import { useMemo } from 'react';
import { useApp } from '../state/AppState';
import { SCHOLARSHIPS } from '../data/scholarships';
import { evaluate } from '../lib/match';
import { daysUntil, formatDate } from '../lib/dates';
import { Button, Metric, PageHead, Tag } from '../components/ui';
import { BookIcon, ClockIcon, SparkIcon } from '../components/icons';

export default function Deadlines({ onDetails }: { onDetails: (id: number) => void }) {
  const { state, dispatch, notify } = useApp();

  const upcoming = useMemo(
    () =>
      SCHOLARSHIPS.filter((s) => daysUntil(s.deadline) >= 0).sort((a, b) =>
        a.deadline.localeCompare(b.deadline),
      ),
    [],
  );
  const urgent = upcoming.filter((s) => daysUntil(s.deadline) <= 14);
  const trackedCount = upcoming.filter((s) => state.tracking[s.id] !== undefined).length;

  return (
    <>
      <PageHead eyebrow="Plan ahead, apply calmly" title="Your deadline calendar.">
        One timeline for every opportunity still open — sorted by closing date.
      </PageHead>

      <div className="metric-grid">
        <Metric label="Open opportunities" value={upcoming.length} hint="With deadlines ahead" icon={<ClockIcon />} />
        <Metric label="Closing in 14 days" value={urgent.length} hint="Prioritise these first" icon={<SparkIcon />} />
        <Metric label="Already tracking" value={trackedCount} hint="In your pipeline" icon={<BookIcon />} />
        <Metric
          label="Soonest close"
          value={upcoming[0] !== undefined ? `${daysUntil(upcoming[0].deadline)}d` : '—'}
          hint={upcoming[0]?.name ?? 'No deadlines listed'}
          icon={<ClockIcon />}
        />
      </div>

      <ol className="timeline" aria-label="Upcoming deadlines">
        {upcoming.map((s) => {
          const d = formatDate(s.deadline);
          const ev = evaluate(s, state.profile, state.readyDocs);
          const days = daysUntil(s.deadline);
          const tracked = state.tracking[s.id] !== undefined;
          return (
            <li key={s.id} className="timeline-item">
              <span className="timeline-date" aria-hidden="true">
                {d.day}
                <small>{d.month}</small>
              </span>
              <div className="timeline-info">
                <button type="button" className="link" onClick={() => onDetails(s.id)}>
                  {s.name}
                </button>
                <small>
                  {s.org} · {s.amount}
                </small>
              </div>
              <Tag tone={ev.eligible ? 'good' : 'warn'}>
                {ev.eligible ? `Strong match · ${days} days` : `Check fit · ${days} days`}
              </Tag>
              <Button
                small
                variant={tracked ? 'subtle' : 'primary'}
                onClick={() => {
                  if (tracked) {
                    dispatch({ type: 'navigate', page: 'applications' });
                  } else {
                    dispatch({ type: 'track', id: s.id });
                    notify('Saved to your application pipeline');
                  }
                }}
              >
                {tracked ? 'Tracking ✓' : '+ Track'}
              </Button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
