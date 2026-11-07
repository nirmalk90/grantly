import { useApp } from '../state/AppState';
import { SCHOLARSHIPS } from '../data/scholarships';
import { evaluate } from '../lib/match';
import { daysUntil } from '../lib/dates';
import { Button, Empty, PageHead, ProgressBar } from '../components/ui';
import type { Stage } from '../types';

const STAGES: { key: Stage; label: string }[] = [
  { key: 'saved', label: 'Saved' },
  { key: 'progress', label: 'In progress' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'awarded', label: 'Awarded' },
];

export default function Applications() {
  const { state, dispatch, notify } = useApp();
  const tracked = Object.entries(state.tracking);

  const byStage = (stage: Stage) =>
    tracked
      .map(([id, s]) => ({ id: Number(id), stage: s }))
      .filter((t) => t.stage === stage)
      .map((t) => SCHOLARSHIPS.find((s) => s.id === t.id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (tracked.length === 0) {
    return (
      <>
        <PageHead eyebrow="Stay on top of every step" title="Your application pipeline.">
          Move an opportunity forward as you make progress.
        </PageHead>
        <Empty
          title="Nothing tracked yet"
          hint="Save scholarships from Discover to build your pipeline. Checklists sync with your document vault."
        />
        <div className="center-cta">
          <Button variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
            Find scholarships
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Stay on top of every step"
        title="Your application pipeline."
        actions={
          <Button variant="primary" onClick={() => dispatch({ type: 'navigate', page: 'discover' })}>
            + Find scholarships
          </Button>
        }
      >
        A kanban for your funding journey — Saved, In progress, Submitted, Awarded.
      </PageHead>

      <div className="board" role="group" aria-label="Application stages">
        {STAGES.map(({ key, label }) => {
          const items = byStage(key);
          return (
            <section key={key} className="board-col" aria-labelledby={`stage-${key}`}>
              <div className="board-head">
                <h2 id={`stage-${key}`}>{label}</h2>
                <span aria-label={`${items.length} applications`}>{items.length}</span>
              </div>
              {items.length === 0 && <p className="board-empty">Nothing here yet</p>}
              {items.map((s) => {
                const ev = evaluate(s, state.profile, state.readyDocs);
                return (
                  <article key={s.id} className="task">
                    <p className="task-amt">{s.amount}</p>
                    <h3>{s.name}</h3>
                    <small>
                      {s.org} · {daysUntil(s.deadline)} days left
                    </small>
                    <ProgressBar value={ev.docCompletion} label={`Documents ready for ${s.name}`} />
                    <small>
                      {ev.docsReady}/{ev.docsRequired} documents ready
                    </small>
                    <ul className="doc-checklist compact">
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
                    <div className="task-foot">
                      <label>
                        <span className="visually-hidden">Move {s.name} to stage</span>
                        <select
                          className="control"
                          value={key}
                          onChange={(e) => {
                            const stage = e.target.value as Stage;
                            dispatch({ type: 'move', id: s.id, stage });
                            if (stage === 'awarded') notify('Congratulations — that is wonderful news!');
                          }}
                        >
                          {STAGES.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {s.applyUrl !== '' && (
                        <a
                          href={s.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-subtle btn-sm"
                          title="Open official portal"
                          style={{ textDecoration: 'none' }}
                        >
                          Portal ↗
                        </a>
                      )}
                      <Button
                        small
                        variant="danger"
                        onClick={() => {
                          dispatch({ type: 'untrack', id: s.id });
                          notify('Removed from your tracker');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
