import type { AppState, Profile } from '../types';
import { DEFAULT_READY_DOCS } from '../data/scholarships';

export const INITIAL_PROFILE: Profile = {
  name: 'Aditya Kumar',
  level: 'UG',
  category: 'All',
  income: 300_000,
  marks: 82,
  state: 'Bihar',
  gender: 'F',
  interests: 'computer science, AI, community work',
};

export const INITIAL_STATE: AppState = {
  page: 'overview',
  profile: INITIAL_PROFILE,
  query: '',
  filter: 'all',
  sort: 'best',
  tracking: {},
  readyDocs: [...DEFAULT_READY_DOCS],
  theme: 'dark',
};
