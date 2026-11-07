import { useMemo } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { DOCUMENTS } from '../data/scholarships';
import { daysUntil, deadlineLabel, formatDate } from '../lib/dates';
import {
  getClosingSoon,
  getDocumentReadiness,
  getEligibleScholarships,
  getEvaluatedScholarships,
  getGreeting,
  getOpenScholarships,
  getRelevantDocumentReadiness,
} from '../lib/selectors';
import { useToday } from '../lib/useToday';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Button, Empty, Metric, PageHead, ProgressBar } from '../components/ui';
import { ArrowIcon, BookIcon, ClockIcon, FileIcon, SparkIcon } from '../components/icons';

interface Props {
  onDetails: (id: number) => void;
  onOpenProfile: () => void;
}

export default function Overview({ onDetails, onOpenProfile }: Props) {
  const state = useAppState();
  const { dispatch } = useAppActions();
  const today = useToday();

  const derived = useMemo(() => {
    const now = new Date(`${today}T12:00:00+05:30`);
    const evaluated = getEvaluatedScholarships(state.profile, state.readyDocs);
    const eligible = getEligibleScholarships(evaluated);
    const openEligible = getOpenScholarships(eligible, now);
    const urgent = getClosingSoon(openEligible, now);
    return { eligible, openEligible, urgent };
  }, [state.profile, state.readyDocs, today]);

  const tracked = Object.keys(state.tracking).length;
  const docReadiness = getDocumentReadiness(state.readyDocs);
  const relevant = getRelevantDocumentReadiness(derived.eligible.map((r) => r.scholarship), state.readyDocs);
  const readinessPct = Math.round(relevant.ratio * 100);
  const next = derived.openEligible[0];

  return (
    <>
      <PageHead
        eyebrow="Your funding journey"
        title={`Good ${getGreeting()}, ${state.profile.name.split(' ')[0] ?? 'there'}`}
        actions={<Button variant="subtle" onClick={onOpenProfile}>Edit profile</Button>}
      >
        One clear view of your opportunities, documents, and next steps.
      </PageHead>

      <section className="hero" aria-label="Summary">
        <div className="hero-copy">
          <p className="hero-kicker">Personal funding dashboard</p>
          <h2>Make your next big step<br />feel a little more possible.</h2>
          <p>
            {derived.eligible.length} scholarships fit your profile
            {next !== undefined
              ? ` — the next closes ${formatDate(next.scholarship.deadline).full} (${deadlineLabel(daysUntil(next.scholarship.deadline))}).`
              : '.'}
          </p>
          <div className="hero-cta">
            <Button variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
              Explore your matches <ArrowIcon />
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'navigate', page: 'assistant' })}>
              Ask the local assistant
            </Button>
          </div>
        </div>
        <div className="hero-ring">
          <div className="readiness-donut" role="img" aria-label={`Application readiness ${readinessPct} percent`}>
            <span>{readinessPct}%</span>
          </div>
          <small>application readiness</small>
        </div>
      </section>

      <ul className="metric-grid" aria-label="Key metrics">
        <Metric label="Matched opportunities" value={derived.eligible.length} hint="Personalised to your profile" icon={<SparkIcon />} />
        <Metric label="Applications in motion" value={tracked} hint="Across your pipeline" icon={<BookIcon />} />
        <Metric label="Deadlines in 14 days" value={derived.urgent.length} hint="Plan your next move early" icon={<ClockIcon />} />
        <Metric
          label="Documents ready"
          value={<>{docReadiness.ready}<span className="metric-total">/{DOCUMENTS.length}</span></>}
          hint={`${Math.round(docReadiness.ratio * 100)}% of your checklist`}
          icon={<FileIcon />}
        />
      </ul>

      <div className="split">
        <section aria-labelledby="rec-title">
          <div className="section-title">
            <div>
              <h2 id="rec-title">Recommended for you</h2>
              <p>Open opportunities ranked by eligibility and closing date</p>
            </div>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
              See all <ArrowIcon />
            </Button>
          </div>
          <div className="card-list">
            {derived.openEligible.length === 0 ? (
              <Empty
                title="No open eligible opportunities"
                hint="Update your profile or check back later for new demo deadlines."
                action={<Button small onClick={onOpenProfile}>Edit profile</Button>}
              />
            ) : (
              derived.openEligible.slice(0, 3).map(({ scholarship, evaluation }) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} evaluation={evaluation} onDetails={onDetails} />
              ))
            )}
          </div>
        </section>

        <aside className="side-stack">
          <div className="panel">
            <h3 className="panel-title">Application readiness</h3>
            <ProgressBar value={relevant.ratio} label="Documents ready for your eligible matches" />
            <p className="panel-note">
              {relevant.ready} of {relevant.total} documents needed by your eligible matches are marked ready.
            </p>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'vault' })}>Open document vault</Button>
          </div>
          <div className="panel">
            <h3 className="panel-title">Coming up next</h3>
            <ul className="mini-list">
              {derived.openEligible.length === 0 && <li className="panel-note">No open eligible deadlines.</li>}
              {derived.openEligible.slice(0, 3).map(({ scholarship }) => {
                const d = formatDate(scholarship.deadline);
                return (
                  <li key={scholarship.id}>
                    <span className="mini-date" aria-hidden="true">{d.day}<small>{d.month}</small></span>
                    <span className="mini-info">
                      <strong>{scholarship.name}</strong>
                      <small>{scholarship.org}</small>
                    </span>
                    <span className="mini-days">{deadlineLabel(daysUntil(scholarship.deadline))}</span>
                  </li>
                );
              })}
            </ul>
            <Button small onClick={() => dispatch({ type: 'navigate', page: 'deadlines' })}>View all deadlines</Button>
          </div>
          <div className="panel panel-accent">
            <h3 className="panel-title">Try the local assistant</h3>
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
