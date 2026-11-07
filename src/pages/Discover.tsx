import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { useCatalog } from '../state/CatalogContext';
import { daysUntil } from '../lib/dates';
import { cleanText } from '../lib/sanitize';
import { getEvaluatedScholarships } from '../lib/selectors';
import { useToday } from '../lib/useToday';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Button, Empty, PageHead } from '../components/ui';
import { SearchIcon } from '../components/icons';
import { LEVELS } from '../data/profile';
const FILTERS = [{ key: 'all', label: 'All' }, { key: 'eligible', label: 'Matches my profile' }, { key: 'closing', label: 'Closing soon' }];
export default function Discover({ onDetails, onOpenProfile }: { onDetails: (id: number) => void; onOpenProfile: () => void }) {
  const state = useAppState(); const { scholarships } = useCatalog(); const today = useToday(); const [params, setParams] = useSearchParams();
  const query = cleanText(params.get('q') ?? '', 80), filter = params.get('fit') ?? 'all', sort = params.get('sort') ?? 'best', level = params.get('level') ?? '', funding = params.get('funding') ?? '';
  const update = (key: string, value: string): void => { setParams((prev) => { const next = new URLSearchParams(prev); if (value === '' || value === 'all' || value === 'best') next.delete(key); else next.set(key, value); return next; }, { replace: true }); };
  const now = useMemo(() => new Date(`${today}T12:00:00+05:30`), [today]);
  const evaluated = useMemo(() => getEvaluatedScholarships(scholarships, state.profile, state.readyDocs, now), [scholarships, state.profile, state.readyDocs, now]);
  const items = useMemo(() => {
    const q = query.toLowerCase();
    let ranked = evaluated.filter(({ scholarship: s, evaluation: ev }) => (!q || `${s.name} ${s.org} ${s.kind} ${s.about}`.toLowerCase().includes(q)) && (filter !== 'eligible' || ev.eligible) && (!level || s.levels.includes(level as never)) && (!funding || s.fundingType === funding) && (filter !== 'closing' || (daysUntil(s.deadline, now) >= 0 && daysUntil(s.deadline, now) <= 14)));
    if (sort === 'deadline') ranked = [...ranked].sort((a, b) => { const p = (d: string | null): number => d === null ? 2 : daysUntil(d, now) < 0 ? 3 : 0; return p(a.scholarship.deadline) - p(b.scholarship.deadline) || (a.scholarship.deadline ?? '9999').localeCompare(b.scholarship.deadline ?? '9999') || a.scholarship.id - b.scholarship.id; });
    if (sort === 'award') ranked = [...ranked].sort((a, b) => (b.scholarship.amount ?? -1) - (a.scholarship.amount ?? -1) || a.scholarship.id - b.scholarship.id);
    return ranked;
  }, [evaluated, query, filter, sort, level, funding, now]);
  return <>
    <PageHead eyebrow="Discover & compare" title="Find your next opportunity.">Explore {scholarships.length} source-linked scholarships and education loans. Your profile stays on this device.</PageHead>
    <div className="profile-strip"><div className="profile-left"><div><strong>{state.profile.complete ? 'Your match profile' : 'Get more useful matches'}</strong><small>{state.profile.complete ? `${state.profile.level} · ${state.profile.category} · ${state.profile.state}` : 'Add your study level, state and eligibility details. No name or account required.'}</small></div></div><Button small onClick={onOpenProfile}>{state.profile.complete ? 'Edit profile' : 'Set up profile'}</Button></div>
    <form className="filters" role="search" aria-label="Search and filter scholarships" onSubmit={(e) => e.preventDefault()}>
      <div className="search"><SearchIcon /><input type="search" aria-label="Search scholarships or providers" placeholder="Search scholarships or providers" value={query} onChange={(e) => update('q', cleanText(e.target.value, 80))} /></div>
      <div className="filter-pills" role="group" aria-label="Filter scholarships">{FILTERS.map((f) => <button key={f.key} type="button" className={`chip ${filter === f.key ? 'is-active' : ''}`} aria-pressed={filter === f.key} onClick={() => update('fit', f.key)}>{f.label}</button>)}</div>
      <div className="filter-selects"><label>Study level<select className="control" value={level} onChange={(e) => update('level', e.target.value)}><option value="">All levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label><label>Funding<select className="control" value={funding} onChange={(e) => update('funding', e.target.value)}><option value="">All funding</option><option value="grant">Scholarships / grants</option><option value="loan">Education loans</option></select></label><label>Sort by<select className="control" value={sort} onChange={(e) => update('sort', e.target.value)}><option value="best">Best match</option><option value="deadline">Earliest deadline</option><option value="award">Published award</option></select></label></div>
    </form>
    <p className="result-note" role="status" aria-live="polite">Showing {items.length} of {scholarships.length} opportunities · {evaluated.filter((r) => r.evaluation.eligible).length} profile matches. Additional scheme conditions still apply.</p>
    <div className="card-list">{items.length === 0 ? <Empty title="No scholarships match these filters" hint="Try a broader search or complete your profile. Unknown dates are never counted as closing soon." action={<Button variant="primary" onClick={() => setParams({})}>Clear all filters</Button>} /> : items.map(({ scholarship, evaluation }) => <ScholarshipCard key={scholarship.id} scholarship={scholarship} evaluation={evaluation} onDetails={onDetails} />)}</div>
  </>;
}
