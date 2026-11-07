import { beforeEach, describe, expect, it } from 'vitest';
import { clearDocuments, deleteDocument, getDocument, listDocuments, MAX_FILE_BYTES, MAX_VAULT_BYTES, putDocument, validateFile } from './documents';
const pdf = (name = 'proof.pdf', size = 100) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });
describe('local IndexedDB document vault', () => {
  beforeEach(async () => { await clearDocuments(); });
  it('stores and retrieves actual blobs, exposing only metadata in listings', async () => {
    await putDocument(pdf(), 'Aadhaar'); const stored = await getDocument('Aadhaar');
    expect(stored?.name).toBe('proof.pdf'); expect((await listDocuments())[0]?.size).toBe(100);
    const list = await listDocuments(); expect(list).toHaveLength(1); expect(list[0]).not.toHaveProperty('blob');
    await deleteDocument('Aadhaar'); expect(await getDocument('Aadhaar')).toBeUndefined();
  });
  it('replaces a document without double-counting the total', async () => { await putDocument(pdf(), 'Aadhaar'); await putDocument(pdf('new.pdf', 200), 'Aadhaar'); expect((await getDocument('Aadhaar'))?.size).toBe(200); expect(await listDocuments()).toHaveLength(1); });
  it('rejects empty, oversized, unsupported and mismatched files', async () => {
    expect(validateFile(pdf('empty.pdf', 0), 'Aadhaar')).toContain('empty');
    expect(validateFile(pdf('big.pdf', MAX_FILE_BYTES + 1), 'Aadhaar')).toContain('10 MB');
    expect(validateFile(new File(['x'], 'x.txt', { type: 'text/plain' }), 'Aadhaar')).toContain('PDF');
    expect(validateFile(new File(['x'], 'x.pdf', { type: 'image/png' }), 'Aadhaar')).toContain('extension');
    expect(validateFile(new File(['x'], 'photo.jpeg', { type: 'image/jpeg' }), 'Aadhaar')).toBeNull();
    expect(validateFile(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }), 'Aadhaar')).toBeNull();
    await expect(putDocument(pdf('bad.txt'), 'Aadhaar')).rejects.toThrow();
  });
  it('enforces the aggregate quota atomically', async () => {
    const large = pdf('large.pdf', MAX_FILE_BYTES);
    const ids = ['Aadhaar', 'Marksheet', 'Bank passbook', 'Admission letter', 'Fee receipt'] as const;
    for (const id of ids) await putDocument(large, id);
    expect(MAX_VAULT_BYTES).toBe(MAX_FILE_BYTES * 5);
    await expect(putDocument(pdf('extra.pdf', 1), 'Passport')).rejects.toThrow('50 MB');
    expect(await getDocument('Passport')).toBeUndefined(); expect(await listDocuments()).toHaveLength(5);
    await clearDocuments(); expect(await listDocuments()).toEqual([]);
  });
});
