import { useMemo } from 'react';
import { useAppState } from '../state/AppState';
import { DOCUMENTS } from '../services/catalog';
import { useCatalog } from '../state/CatalogContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate(); const { scholarships } = useCatalog();
  const today = useToday();

  const derived = useMemo(() => {
    const now = new Date(`${today}T12:00:00+05:30`);
    const evaluated = getEvaluatedScholarships(scholarships, state.profile, state.readyDocs, now);
    const eligible = getEligibleScholarships(evaluated);
    const openEligible = getOpenScholarships(eligible, now);
    const urgent = getClosingSoon(openEligible, now);
    return { eligible, openEligible, urgent, featured: getOpenScholarships(evaluated, now).slice(0, 3) };
  }, [scholarships, state.profile, state.readyDocs, today]);

  const tracked = Object.keys(state.tracking).length;
  const docReadiness = getDocumentReadiness(state.readyDocs);
  const relevant = getRelevantDocumentReadiness(derived.eligible.map((r) => r.scholarship), state.readyDocs);
  const readinessPct = Math.round(relevant.ratio * 100);
  const next = derived.openEligible[0];

  return (
    <>
      <PageHead
        eyebrow="Your funding journey"
        title={state.profile.name ? `Good ${getGreeting()}, ${state.profile.name.split(' ')[0]}` : 'Your scholarship journey starts here.'}
        actions={<Button variant="subtle" onClick={onOpenProfile}>Edit profile</Button>}
      >
        Discover opportunities, prepare documents and manage every application — in one private workspace.
      </PageHead>

      {!state.profile.complete && <section className="onboarding-strip"><div><strong>Make discovery personal</strong><p>Tell us your study level and eligibility. It takes a minute, and nothing leaves your device.</p></div><Button variant="primary" onClick={onOpenProfile}>Set up my profile</Button></section>}
      <section className="hero" aria-label="Summary">
        <div className="hero-copy">
          <p className="hero-kicker">Personal funding dashboard</p>
          <h2>Make your next big step<br />feel a little more possible.</h2>
          <p>
            {state.profile.complete ? `${derived.eligible.length} scholarships pass the initial profile screening` : 'Set up your profile to discover your personal shortlist'}
            {next !== undefined
              ? ` — the next closes ${formatDate(next.scholarship.deadline).full} (${deadlineLabel(daysUntil(next.scholarship.deadline))}).`
              : '.'}
          </p>
          <div className="hero-cta">
            <Button variant="primary" onClick={() => navigate('/discover')}>
              Explore your matches <ArrowIcon />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/assistant')}>
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
        <Metric label="Matched opportunities" value={state.profile.complete ? derived.eligible.length : '—'} hint={state.profile.complete ? 'Initial screening, not an award decision' : 'Complete your profile to screen'} icon={<SparkIcon />} />
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
              <h2 id="rec-title">{state.profile.complete ? 'Recommended for you' : 'Explore published opportunities'}</h2>
              <p>Published open dates; complete your profile for personal screening</p>
            </div>
            <Button small onClick={() => navigate('/discover')}>
              See all <ArrowIcon />
            </Button>
          </div>
          <div className="card-list">
            {!(state.profile.complete ? derived.openEligible.length : derived.featured.length) ? (
              <Empty
                title="No open eligible opportunities"
                hint="Complete your profile for personal screening, or browse the source-linked catalogue."
                action={<Button small onClick={onOpenProfile}>Edit profile</Button>}
              />
            ) : (
              (state.profile.complete ? derived.openEligible.slice(0, 3) : derived.featured).map(({ scholarship, evaluation }) => (
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
            <Button small onClick={() => navigate('/vault')}>Open document vault</Button>
          </div>
          <div className="panel">
            <h3 className="panel-title">Coming up next</h3>
            <ul className="mini-list">
              {derived.openEligible.length === 0 && <li className="panel-note">No verified open deadline yet. Explore the catalogue and check official updates.</li>}
              {(state.profile.complete ? derived.openEligible.slice(0, 3) : derived.featured).map(({ scholarship }) => {
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
            <Button small onClick={() => navigate('/deadlines')}>View all deadlines</Button>
          </div>
          <div className="panel panel-accent">
            <h3 className="panel-title">Try the local assistant</h3>
            <p className="panel-note">
              Ask “which documents am I missing?” or “help me write my statement of purpose”. Runs entirely on-device.
            </p>
            <Button small variant="primary" onClick={() => navigate('/assistant')}>
              <SparkIcon /> Start a chat
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
