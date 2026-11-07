import { describe, expect, it } from 'vitest';
import { DEMO_PRESET, INITIAL_STATE } from '../state/defaults';
import { testScholarships } from '../test/fixtures';
import { answer } from './assistant';
const now = new Date('2026-11-07T12:00:00+05:30');
describe('local assistant', () => {
  it('targets a named scholarship without inventing personal claims', () => { const r = answer('Draft an SOP for AICTE Saksham — Technical Degree', DEMO_PRESET, testScholarships, now); expect(r.text).toContain('Target: AICTE Saksham — Technical Degree'); expect(r.text).toContain('[Add a specific project'); expect(r.related).toEqual([4]); });
  it('asks for profile setup instead of assuming eligibility', () => { expect(answer('What is the next deadline?', INITIAL_STATE, testScholarships, now).text).toContain('Set up your profile'); });
  it('describes documents as marked ready rather than verified', () => { expect(answer('Which documents am I missing?', DEMO_PRESET, testScholarships, now).text).toContain('Marking ready is not verification'); });
  it('is deterministic and distinguishes unknown dates', () => { expect(answer('Tell me about Bihar Student Credit Card', DEMO_PRESET, testScholarships, now)).toEqual(answer('Tell me about Bihar Student Credit Card', DEMO_PRESET, testScholarships, now)); expect(answer('Tell me about Bihar Student Credit Card', DEMO_PRESET, testScholarships, now).text).toContain('Not verified'); });
});
