import type { DocumentId } from '../types';
import { DOCUMENTS } from './catalog';

export interface StoredDocument { id: DocumentId; name: string; type: string; size: number; updatedAt: string; blob: Blob }
export type DocumentMetadata = Omit<StoredDocument, 'blob'>;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_VAULT_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Map([['application/pdf', '.pdf'], ['image/jpeg', '.jpg'], ['image/png', '.png']]);
const DB_NAME = 'grantly-documents';
let dbPromise: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (dbPromise !== null) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('Local file storage is not supported in this browser.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('files')) request.result.createObjectStore('files', { keyPath: 'id' }); };
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); dbPromise = null; }; resolve(request.result); };
    request.onerror = () => { dbPromise = null; reject(new Error('Local file storage could not be opened.')); };
    request.onblocked = () => { dbPromise = null; reject(new Error('Close other Grantly tabs and try again.')); };
  });
  return dbPromise;
}
function requestValue<T>(request: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('The file operation failed. Browser storage may be full.')); }); }
function completed(tx: IDBTransaction): Promise<void> { return new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('The file could not be saved. Browser storage may be full.')); tx.onabort = () => reject(new Error('The file operation was cancelled.')); }); }
export function validateFile(file: File, doc: DocumentId): string | null {
  if (!DOCUMENTS.includes(doc)) return 'Unknown document type.';
  const extension = ALLOWED.get(file.type);
  if (extension === undefined) return 'Choose a PDF, JPEG or PNG file.';
  const lowerName = file.name.toLowerCase();
  const extensionMatches = file.type === 'image/jpeg' ? /\.jpe?g$/.test(lowerName) : lowerName.endsWith(extension);
  if (!extensionMatches) return 'The file extension must match its PDF, JPEG or PNG format.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'Each file must be 10 MB or smaller.';
  return null;
}
export async function listDocuments(): Promise<DocumentMetadata[]> {
  const db = await openDb();
  const records = await requestValue<StoredDocument[]>(db.transaction('files', 'readonly').objectStore('files').getAll());
  return records.map(({ id, name, type, size, updatedAt }) => ({ id, name, type, size, updatedAt })).sort((a, b) => a.id.localeCompare(b.id));
}
export async function putDocument(file: File, id: DocumentId): Promise<void> {
  const error = validateFile(file, id); if (error !== null) throw new Error(error);
  const db = await openDb();
  const tx = db.transaction('files', 'readwrite'), store = tx.objectStore('files');
  const done = completed(tx);
  const records = await requestValue<StoredDocument[]>(store.getAll());
  const total = records.filter((r) => r.id !== id).reduce((sum, r) => sum + r.size, 0) + file.size;
  if (total > MAX_VAULT_BYTES) { tx.abort(); await done.catch(() => undefined); throw new Error('The vault limit is 50 MB. Remove a file before adding this one.'); }
  store.put({ id, name: file.name.slice(0, 180), type: file.type, size: file.size, updatedAt: new Date().toISOString(), blob: file } satisfies StoredDocument);
  await done;
}
export async function getDocument(id: DocumentId): Promise<StoredDocument | undefined> {
  const db = await openDb(); return requestValue<StoredDocument | undefined>(db.transaction('files', 'readonly').objectStore('files').get(id));
}
export async function deleteDocument(id: DocumentId): Promise<void> {
  const db = await openDb(); const tx = db.transaction('files', 'readwrite'); const done = completed(tx); tx.objectStore('files').delete(id); await done;
}
export async function clearDocuments(): Promise<void> {
  const db = await openDb(); const tx = db.transaction('files', 'readwrite'); const done = completed(tx); tx.objectStore('files').clear(); await done;
}
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
