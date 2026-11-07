import { useMemo } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { daysUntil, deadlineLabel, formatDate } from '../lib/dates';
import { getClosingSoon, getEvaluatedScholarships, getOpenScholarships, getOpenTrackedCount } from '../lib/selectors';
import { useToday } from '../lib/useToday';
import { Button, Empty, Metric, PageHead, Tag } from '../components/ui';
import { BookIcon, ClockIcon, SparkIcon } from '../components/icons';

export default function Deadlines({ onDetails }: { onDetails: (id: number) => void }) {
  const state = useAppState();
  const { dispatch, notify } = useAppActions();
  const today = useToday();

  const { open, urgent, trackedCount } = useMemo(() => {
    const now = new Date(`${today}T12:00:00+05:30`);
    const evaluated = getEvaluatedScholarships(state.profile, state.readyDocs);
    const open = getOpenScholarships(evaluated, now);
    return {
      open,
      urgent: getClosingSoon(open, now),
      trackedCount: getOpenTrackedCount(state.tracking, now),
    };
  }, [state.profile, state.readyDocs, state.tracking, today]);

  return (
    <>
      <PageHead eyebrow="Plan ahead, apply calmly" title="Your deadline calendar.">
        One timeline for every opportunity still open — sorted by closing date in Asia/Kolkata.
      </PageHead>

      <ul className="metric-grid" aria-label="Deadline metrics">
        <Metric label="Open opportunities" value={open.length} hint="With deadlines ahead" icon={<ClockIcon />} />
        <Metric label="Closing in 14 days" value={urgent.length} hint="Prioritise these first" icon={<SparkIcon />} />
        <Metric label="Already tracking" value={trackedCount} hint="In your pipeline" icon={<BookIcon />} />
        <Metric
          label="Soonest close"
          value={open[0] !== undefined ? deadlineLabel(daysUntil(open[0].scholarship.deadline)) : '—'}
          hint={open[0]?.scholarship.name ?? 'No deadlines listed'}
          icon={<ClockIcon />}
        />
      </ul>

      {open.length === 0 ? (
        <Empty
          title="No open deadlines"
          hint="All demo deadlines have passed. Check back later or explore the catalogue."
          action={<Button variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>Find scholarships</Button>}
        />
      ) : (
        <ol className="timeline" aria-label="Upcoming deadlines">
          {open.map(({ scholarship: s, evaluation: ev }) => {
            const d = formatDate(s.deadline);
            const days = daysUntil(s.deadline);
            const tracked = state.tracking[s.id] !== undefined;
            return (
              <li key={s.id} className="timeline-item">
                <time className="timeline-date" dateTime={s.deadline} aria-label={`${d.full}, ${deadlineLabel(days)}`}>
                  {d.day}<small>{d.month}</small>
                </time>
                <div className="timeline-info">
                  <button type="button" className="link" onClick={() => onDetails(s.id)}>{s.name}</button>
                  <small>{s.org} · {s.amount}</small>
                </div>
                <Tag tone={ev.eligible ? 'good' : 'warn'}>
                  {ev.eligible ? `Strong match · ${deadlineLabel(days)}` : `Check fit · ${deadlineLabel(days)}`}
                </Tag>
                <Button
                  small
                  variant={tracked ? 'subtle' : 'primary'}
                  aria-pressed={tracked}
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
      )}
    </>
  );
}
