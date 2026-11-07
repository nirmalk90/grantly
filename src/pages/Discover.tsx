import { useMemo } from 'react';
import { useApp } from '../state/AppState';
import { SCHOLARSHIPS } from '../data/scholarships';
import { rankScholarships } from '../lib/match';
import { daysUntil } from '../lib/dates';
import { cleanText } from '../lib/sanitize';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Button, Empty, PageHead } from '../components/ui';
import { SearchIcon } from '../components/icons';
import type { Filter, SortKey } from '../types';

interface Props {
  onDetails: (id: number) => void;
  onOpenProfile: () => void;
}

export default function Discover({ onDetails, onOpenProfile }: Props) {
  const { state, dispatch } = useApp();

  const items = useMemo(() => {
    let ranked = rankScholarships(SCHOLARSHIPS, state.profile, state.readyDocs);
    const q = state.query.trim().toLowerCase();
    if (q !== '') {
      ranked = ranked.filter(
        (r) => r.scholarship.name.toLowerCase().includes(q) || r.scholarship.org.toLowerCase().includes(q),
      );
    }
    if (state.filter === 'eligible') ranked = ranked.filter((r) => r.evaluation.eligible);
    if (state.filter === 'closing') {
      ranked = ranked.filter((r) => {
        const d = daysUntil(r.scholarship.deadline);
        return d >= 0 && d <= 14;
      });
    }
    if (state.sort === 'deadline') {
      ranked = [...ranked].sort((a, b) => a.scholarship.deadline.localeCompare(b.scholarship.deadline));
    }
    return ranked;
  }, [state.profile, state.readyDocs, state.query, state.filter, state.sort]);

  const eligibleCount = useMemo(
    () => rankScholarships(SCHOLARSHIPS, state.profile, state.readyDocs).filter((r) => r.evaluation.eligible).length,
    [state.profile, state.readyDocs],
  );

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
        <Button small onClick={onOpenProfile}>
          Edit profile
        </Button>
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
        <label className="visually-hidden" htmlFor="filter-select">
          Filter scholarships
        </label>
        <select
          id="filter-select"
          className="control"
          value={state.filter}
          onChange={(e) => dispatch({ type: 'set-filter', filter: e.target.value as Filter })}
        >
          <option value="all">All opportunities</option>
          <option value="eligible">Eligible for me</option>
          <option value="closing">Closing soon</option>
        </select>
        <label className="visually-hidden" htmlFor="sort-select">
          Sort scholarships
        </label>
        <select
          id="sort-select"
          className="control"
          value={state.sort}
          onChange={(e) => dispatch({ type: 'set-sort', sort: e.target.value as SortKey })}
        >
          <option value="best">Best match</option>
          <option value="deadline">Earliest deadline</option>
        </select>
      </div>

      <p className="result-note" role="status" aria-live="polite">
        {eligibleCount} strong matches found — we explain every score so you can apply with confidence.
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
