import { useEffect, useRef, useState } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { useCatalog } from '../state/CatalogContext';
import { DOCUMENTS } from '../services/catalog';
import { deleteDocument, downloadBlob, getDocument, listDocuments, putDocument } from '../services/documents';
import type { DocumentMetadata } from '../services/documents';
import { getRelevantDocumentReadiness } from '../lib/selectors';
import { Button, PageHead, ProgressBar } from '../components/ui';
import { FileIcon } from '../components/icons';
import type { DocumentId } from '../types';
export default function Vault() {
  const state = useAppState(); const { dispatch, notify } = useAppActions(); const { scholarships } = useCatalog();
  const tracked = scholarships.filter((s) => state.tracking[s.id] !== undefined);
  const readiness = getRelevantDocumentReadiness(tracked.length > 0 ? tracked : scholarships, state.readyDocs);
  const [files, setFiles] = useState<DocumentMetadata[]>([]); const [busy, setBusy] = useState<DocumentId | null>(null); const [error, setError] = useState(''); const [storageReady, setStorageReady] = useState(false); const [remove, setRemove] = useState<DocumentId | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; listDocuments().then((data) => { if (mounted.current) { setFiles(data); setStorageReady(true); } }).catch(() => { if (mounted.current) setError('Local file storage is unavailable. Your readiness checklist still works.'); }); return () => { mounted.current = false; }; }, []);
  const upload = async (doc: DocumentId, file: File | undefined): Promise<void> => {
    if (file === undefined) return; setBusy(doc); setError('');
    try { await putDocument(file, doc); const next = await listDocuments(); if (mounted.current) { setFiles(next); setStorageReady(true); } notify(`${doc} saved only on this device`); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not save this file.'); }
    finally { if (mounted.current) setBusy(null); }
  };
  const download = async (doc: DocumentId): Promise<void> => { try { const file = await getDocument(doc); if (file === undefined) throw new Error('File not found. It may have been removed in another tab.'); downloadBlob(file.blob, file.name); } catch (e) { setError(e instanceof Error ? e.message : 'Could not open this file.'); } };
  return <><PageHead eyebrow="Prepare once, apply everywhere" title="Your private document vault.">Keep a local copy and mark documents ready. Files never leave this browser.</PageHead>
    <div className="panel vault-summary"><div><strong>{Math.round(readiness.ratio * 100)}% prepared</strong><p className="panel-note">{readiness.ready} of {readiness.total} documents needed by {tracked.length > 0 ? 'your tracked applications' : 'the catalogue'} marked ready</p></div><ProgressBar value={readiness.ratio} label="Relevant document readiness" /></div>
    <div className="source-box vault-privacy"><strong>Local storage, not cloud backup</strong><p>PDF, JPEG or PNG · up to 10 MB per file / 50 MB total. Files are unencrypted and tied to this browser. Keep originals elsewhere. Upload only to the official application portal.</p></div>
    {error !== '' && <p className="form-error" role="alert">{error}</p>}
    <ul className="vault-grid" aria-label="Document checklist">{DOCUMENTS.map((doc) => {
      const needed = scholarships.filter((s) => s.docs.includes(doc)).length; const ready = state.readyDocs.includes(doc); const file = files.find((f) => f.id === doc);
      return <li key={doc} className="vault-doc"><div className="vault-doc-head"><span className={`doc-icon ${ready ? 'ready' : ''}`} aria-hidden="true"><FileIcon /></span><label className="check-line grow"><input type="checkbox" checked={ready} onChange={() => dispatch({ type: 'toggle-doc', doc })} /><span><strong>{doc}</strong><small>Referenced by {needed} opportunit{needed === 1 ? 'y' : 'ies'}</small></span></label><span className={`doc-status ${ready ? 'ok' : ''}`}>{ready ? 'Ready' : 'Not ready'}</span></div>
        {file !== undefined ? <div className="file-row"><span title={file.name}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span><div className="dialog-action-group"><Button small onClick={() => { void download(doc); }} aria-label={`Download local copy of ${doc}`}>Download</Button><Button small variant="danger" aria-label={`Delete local file for ${doc}`} onClick={() => setRemove(doc)}>Delete</Button></div></div> : <label className="file-upload"><span>{busy === doc ? 'Saving…' : '+ Add local file'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label={`Upload local file for ${doc}`} disabled={busy !== null || !storageReady} onChange={(e) => { void upload(doc, e.target.files?.[0]); e.target.value = ''; }} /></label>}
        {remove === doc && <div className="inline-confirm"><span>Delete this local file? Your original is not affected.</span><Button small onClick={() => setRemove(null)}>Keep</Button><Button small variant="danger" onClick={() => { void deleteDocument(doc).then(() => listDocuments()).then((next) => { setFiles(next); setRemove(null); notify('Local file deleted'); }).catch(() => setError('Could not delete the file. Try again.')); }}>Delete file</Button></div>}
      </li>;
    })}</ul>
  </>;
}
