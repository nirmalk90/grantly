import { useMemo } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { SCHOLARSHIPS } from '../data/scholarships';
import { daysUntil } from '../lib/dates';
import { cleanText } from '../lib/sanitize';
import { getEvaluatedScholarships } from '../lib/selectors';
import { useToday } from '../lib/useToday';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Button, Empty, PageHead } from '../components/ui';
import { SearchIcon } from '../components/icons';
import type { Filter, SortKey } from '../types';

interface Props {
  onDetails: (id: number) => void;
  onOpenProfile: () => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'eligible', label: 'Eligible for me' },
  { key: 'closing', label: 'Closing soon' },
];

export default function Discover({ onDetails, onOpenProfile }: Props) {
  const state = useAppState();
  const { dispatch } = useAppActions();
  const today = useToday();

  const evaluated = useMemo(
    () => getEvaluatedScholarships(state.profile, state.readyDocs),
    [state.profile, state.readyDocs],
  );
  const eligibleCount = evaluated.filter((r) => r.evaluation.eligible).length;

  const items = useMemo(() => {
    const now = new Date(`${today}T12:00:00+05:30`);
    let ranked = evaluated;
    const q = state.query.trim().toLowerCase();
    if (q !== '') {
      ranked = ranked.filter(
        (r) => r.scholarship.name.toLowerCase().includes(q) || r.scholarship.org.toLowerCase().includes(q),
      );
    }
    if (state.filter === 'eligible') ranked = ranked.filter((r) => r.evaluation.eligible);
    if (state.filter === 'closing') {
      ranked = ranked.filter((r) => {
        const d = daysUntil(r.scholarship.deadline, now);
        return d >= 0 && d <= 14;
      });
    }
    if (state.sort === 'deadline') {
      ranked = [...ranked].sort((a, b) => {
        const aClosed = daysUntil(a.scholarship.deadline, now) < 0 ? 1 : 0;
        const bClosed = daysUntil(b.scholarship.deadline, now) < 0 ? 1 : 0;
        return aClosed - bClosed || a.scholarship.deadline.localeCompare(b.scholarship.deadline) || a.scholarship.id - b.scholarship.id;
      });
    }
    return ranked;
  }, [evaluated, state.query, state.filter, state.sort, today]);

  return (
    <>
      <PageHead eyebrow="Discover & compare" title="Find your next opportunity.">
        Scholarships and student funding, matched to your real-life profile.
      </PageHead>

      <div className="profile-strip">
        <div className="profile-left">
          <div>
            <strong>Your match profile</strong>
            <small>
              {state.profile.level} · {state.profile.category} · ₹
              {(state.profile.income / 100_000).toFixed(1)}L income · {state.profile.marks}% marks ·{' '}
              {state.profile.state}
            </small>
          </div>
        </div>
        <Button small onClick={onOpenProfile}>Edit profile</Button>
      </div>

      <div className="filters" role="group" aria-label="Search and filters">
        <div className="search">
          <SearchIcon />
          <input
            type="search"
            aria-label="Search scholarships or providers"
            placeholder="Search scholarships or providers"
            value={state.query}
            onChange={(e) => dispatch({ type: 'set-query', query: cleanText(e.target.value, 80) })}
          />
        </div>
        <div className="filter-pills" role="group" aria-label="Filter scholarships">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`chip ${state.filter === filter.key ? 'is-active' : ''}`}
              aria-pressed={state.filter === filter.key}
              onClick={() => dispatch({ type: 'set-filter', filter: filter.key })}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="visually-hidden" htmlFor="sort-select">Sort scholarships</label>
        <select
          id="sort-select"
          className="control"
          value={state.sort}
          onChange={(e) => dispatch({ type: 'set-sort', sort: e.target.value as SortKey })}
        >
          <option value="best">Best match</option>
          <option value="deadline">Earliest open deadline</option>
        </select>
      </div>

      <p className="result-note" role="status" aria-live="polite">
        Showing {items.length} of {SCHOLARSHIPS.length} opportunities · {eligibleCount} eligible for your profile.
      </p>

      <div className="card-list">
        {items.length === 0 ? (
          <Empty
            title="No scholarships match these filters"
            hint="Try a broader search, or clear your search and filters."
            action={
              <Button
                small
                variant="primary"
                onClick={() => {
                  dispatch({ type: 'set-query', query: '' });
                  dispatch({ type: 'set-filter', filter: 'all' });
                  dispatch({ type: 'set-sort', sort: 'best' });
                }}
              >
                Clear all filters
              </Button>
            }
          />
        ) : (
          items.map(({ scholarship, evaluation }) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              evaluation={evaluation}
              onDetails={onDetails}
            />
          ))
        )}
      </div>
    </>
  );
}
