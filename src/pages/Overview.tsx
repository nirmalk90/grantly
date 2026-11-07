import { useMemo } from 'react';
import { useApp } from '../state/AppState';
import { SCHOLARSHIPS, DOCUMENTS } from '../data/scholarships';
import { evaluate } from '../lib/match';
import { daysUntil, formatDate } from '../lib/dates';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Button, Metric, PageHead, ProgressBar } from '../components/ui';
import { ArrowIcon, BookIcon, ClockIcon, FileIcon, SparkIcon } from '../components/icons';

interface Props {
  onDetails: (id: number) => void;
  onOpenProfile: () => void;
}

export default function Overview({ onDetails, onOpenProfile }: Props) {
  const { state, dispatch } = useApp();

  const derived = useMemo(() => {
    const evaluated = SCHOLARSHIPS.map((s) => ({ s, ev: evaluate(s, state.profile, state.readyDocs) }));
    const eligible = evaluated.filter((x) => x.ev.eligible);
    const byDeadline = [...eligible].sort((a, b) => a.s.deadline.localeCompare(b.s.deadline));
    const urgent = eligible.filter((x) => {
      const d = daysUntil(x.s.deadline);
      return d >= 0 && d <= 14;
    });
    return { eligible, byDeadline, urgent };
  }, [state.profile, state.readyDocs]);

  const tracked = Object.keys(state.tracking).length;
  const docPct = state.readyDocs.length / DOCUMENTS.length;
  const next = derived.byDeadline.find((x) => daysUntil(x.s.deadline) >= 0);

  return (
    <>
      <PageHead
        eyebrow="Your funding journey"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${state.profile.name.split(' ')[0] ?? 'there'}`}
        actions={
          <Button variant="subtle" onClick={onOpenProfile}>
            Edit profile
          </Button>
        }
      >
        One clear view of your opportunities, documents, and next steps.
      </PageHead>

      <section className="hero" aria-label="Summary">
        <div className="hero-copy">
          <p className="hero-kicker">Personal funding dashboard</p>
          <h2>
            Make your next big step
            <br />
            feel a little more possible.
          </h2>
          <p>
            {derived.eligible.length} scholarships fit your profile
            {next !== undefined
              ? ` — the next closes ${formatDate(next.s.deadline).full}, in ${daysUntil(next.s.deadline)} days.`
              : '.'}
          </p>
          <div className="hero-cta">
            <Button variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
              Explore your matches <ArrowIcon />
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'navigate', page: 'assistant' })}>
              Ask the AI assistant
            </Button>
          </div>
        </div>
        <div className="hero-ring">
          <div
            className="readiness-donut"
            role="img"
            aria-label={`Profile strength ${Math.min(99, 60 + derived.eligible.length * 3)} percent`}
          >
            <span>{Math.min(99, 60 + derived.eligible.length * 3)}%</span>
          </div>
          <small>profile strength</small>
        </div>
      </section>

      <div className="metric-grid" role="list" aria-label="Key metrics">
        <Metric label="Matched opportunities" value={derived.eligible.length} hint="Personalised to your profile" icon={<SparkIcon />} />
        <Metric label="Applications in motion" value={tracked} hint="Across your pipeline" icon={<BookIcon />} />
        <Metric label="Deadlines in 14 days" value={derived.urgent.length} hint="Plan your next move early" icon={<ClockIcon />} />
        <Metric
          label="Documents ready"
          value={
            <>
              {state.readyDocs.length}
              <span className="metric-total">/{DOCUMENTS.length}</span>
            </>
          }
          hint={`${Math.round(docPct * 100)}% of your checklist`}
          icon={<FileIcon />}
        />
      </div>

      <div className="split">
        <section aria-labelledby="rec-title">
          <div className="section-title">
            <div>
              <h2 id="rec-title">Recommended for you</h2>
              <p>Ranked by eligibility and closing date</p>
            </div>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
              See all <ArrowIcon />
            </Button>
          </div>
          <div className="card-list">
            {derived.byDeadline.slice(0, 3).map(({ s, ev }) => (
              <ScholarshipCard key={s.id} scholarship={s} evaluation={ev} onDetails={onDetails} />
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <div className="panel">
            <h3 className="panel-title">Application readiness</h3>
            <ProgressBar value={docPct} label="Documents ready" />
            <p className="panel-note">
              {state.readyDocs.length} of {DOCUMENTS.length} documents marked ready.
            </p>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'vault' })}>
              Open document vault
            </Button>
          </div>
          <div className="panel">
            <h3 className="panel-title">Coming up next</h3>
            <ul className="mini-list">
              {derived.byDeadline.slice(0, 3).map(({ s }) => {
                const d = formatDate(s.deadline);
                return (
                  <li key={s.id}>
                    <span className="mini-date">
                      {d.day}
                      <small>{d.month}</small>
                    </span>
                    <span className="mini-info">
                      <strong>{s.name}</strong>
                      <small>{s.org}</small>
                    </span>
                    <span className="mini-days">{daysUntil(s.deadline)}d</span>
                  </li>
                );
              })}
            </ul>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'deadlines' })}>
              View all deadlines
            </Button>
          </div>
          <div className="panel panel-accent">
            <h3 className="panel-title">Try the AI assistant</h3>
            <p className="panel-note">
              Ask “which documents am I missing?” or “help me write my statement of purpose”. Runs entirely on-device.
            </p>
            <Button small variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'assistant' })}>
              <SparkIcon /> Start a chat
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
