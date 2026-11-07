import { useApp } from '../state/AppState';
import { DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import { Button, PageHead, ProgressBar } from '../components/ui';
import { FileIcon } from '../components/icons';

export default function Vault() {
  const { state, dispatch, notify } = useApp();
  const pct = state.readyDocs.length / DOCUMENTS.length;

  return (
    <>
      <PageHead
        eyebrow="Prepare once, apply everywhere"
        title="Your document vault."
        actions={
          <Button
            onClick={() => {
              for (const doc of [...state.readyDocs]) dispatch({ type: 'toggle-doc', doc });
              notify('Checklist reset');
            }}
          >
            Reset checklist
          </Button>
        }
      >
        Keep your application essentials in one place. Every scholarship checklist updates instantly.
      </PageHead>

      <div className="panel vault-summary">
        <div>
          <strong>{Math.round(pct * 100)}% ready</strong>
          <p className="panel-note">
            {state.readyDocs.length} of {DOCUMENTS.length} essentials prepared
          </p>
        </div>
        <ProgressBar value={pct} label="Overall document readiness" />
      </div>

      <ul className="vault-grid" aria-label="Document checklist">
        {DOCUMENTS.map((doc) => {
          const needed = SCHOLARSHIPS.filter((s) => s.docs.includes(doc)).length;
          const ready = state.readyDocs.includes(doc);
          return (
            <li key={doc} className="vault-doc">
              <span className={`doc-icon ${ready ? 'ready' : ''}`} aria-hidden="true">
                <FileIcon />
              </span>
              <label className="check-line grow">
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={() => dispatch({ type: 'toggle-doc', doc })}
                />
                <span>
                  <strong>{doc}</strong>
                  <small>
                    Needed by {needed} opportunit{needed === 1 ? 'y' : 'ies'}
                  </small>
                </span>
              </label>
              <span className={`doc-status ${ready ? 'ok' : ''}`}>{ready ? 'Ready' : 'Missing'}</span>
            </li>
          );
        })}
      </ul>

      <div className="panel panel-accent safety">
        <h3 className="panel-title">Keep your information safe</h3>
        <p className="panel-note">
          Grantly never uploads your documents — this checklist stays in your browser. Always submit sensitive
          documents through the official scholarship portal, and never share passwords or OTPs with anyone.
        </p>
      </div>
    </>
  );
}
