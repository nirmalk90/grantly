import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from '../state/defaults';
import { answer } from './assistant';

describe('local assistant', () => {
  it('targets a named scholarship in SOP drafts', () => {
    const reply = answer('Draft an SOP for Reliance Foundation UG Scholarship', INITIAL_STATE);
    expect(reply.text).toContain('Target: Reliance Foundation UG Scholarship');
    expect(reply.related).toEqual([5]);
  });

  it('describes documents as marked ready rather than verified', () => {
    const reply = answer('Which documents am I missing?', INITIAL_STATE);
    expect(reply.text).not.toContain('verified');
  });

  it('avoids hardcoded loan claims in funding answers', () => {
    const reply = answer('What funds am I eligible for?', INITIAL_STATE);
    expect(reply.text).not.toContain('Bihar Student Credit Card provide low-interest');
  });

  it('is deterministic for the same state and question', () => {
    expect(answer('What is the next deadline?', INITIAL_STATE)).toEqual(answer('What is the next deadline?', INITIAL_STATE));
  });
});
