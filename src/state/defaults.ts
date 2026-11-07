import type { AppState, PersistedData, Profile } from '../types';

/** No fictional student is loaded on a first visit. */
export const INITIAL_PROFILE: Profile = {
  name: '', level: 'UG', category: 'All', income: null, marks: null, state: '',
  gender: 'Unspecified', interests: '', disability: null, minority: null, complete: false,
};
export const INITIAL_STATE: AppState = {
  profile: INITIAL_PROFILE, tracking: {}, readyDocs: [], notes: {}, reminders: {}, theme: 'light', tourSeen: false,
};
export const DEMO_PROFILE: Profile = {
  name: 'Demo student', level: 'UG', category: 'All', income: 300_000, marks: 82,
  state: 'Bihar', gender: 'F', interests: 'computer science and community work',
  disability: false, minority: false, complete: true,
};
export const DEMO_PRESET: PersistedData = {
  ...INITIAL_STATE, profile: DEMO_PROFILE, tracking: { 4: 'saved', 5: 'progress' },
  readyDocs: ['Class 12 marksheet', 'Income certificate'], tourSeen: true,
};
