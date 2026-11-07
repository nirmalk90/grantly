import { useAppActions, useAppState } from '../state/AppState';
import { DOCUMENTS, SCHOLARSHIPS } from '../data/scholarships';
import { getDocumentReadiness } from '../lib/selectors';
import { Button, PageHead, ProgressBar } from '../components/ui';
import { FileIcon } from '../components/icons';

export default function Vault() {
  const state = useAppState();
  const { dispatch, notify } = useAppActions();
  const readiness = getDocumentReadiness(state.readyDocs);

  return (
    <>
      <PageHead
        eyebrow="Prepare once, apply everywhere"
        title="Your document vault."
        actions={
          <Button
            onClick={() => {
              if (state.readyDocs.length === 0 || window.confirm('Reset the document readiness checklist?')) {
                for (const doc of [...state.readyDocs]) dispatch({ type: 'toggle-doc', doc });
                notify('Checklist reset');
              }
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
          <strong>{Math.round(readiness.ratio * 100)}% ready</strong>
          <p className="panel-note">{readiness.ready} of {readiness.total} essentials marked ready</p>
        </div>
        <ProgressBar value={readiness.ratio} label="Overall document readiness" />
      </div>

      <ul className="vault-grid" aria-label="Document checklist">
        {DOCUMENTS.map((doc) => {
          const needed = SCHOLARSHIPS.filter((s) => s.docs.includes(doc)).length;
          const ready = state.readyDocs.includes(doc);
          return (
            <li key={doc} className="vault-doc">
              <span className={`doc-icon ${ready ? 'ready' : ''}`} aria-hidden="true"><FileIcon /></span>
              <label className="check-line grow">
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={() => dispatch({ type: 'toggle-doc', doc })}
                />
                <span>
                  <strong>{doc}</strong>
                  <small>Needed by {needed} opportunit{needed === 1 ? 'y' : 'ies'}</small>
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
          Grantly never uploads or verifies your documents — this checklist stays in your browser. Always submit sensitive
          documents through the official scholarship portal, and never share passwords or OTPs with anyone.
        </p>
      </div>
    </>
  );
}
