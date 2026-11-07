import type { Page } from '../types';
export const PAGE_LABELS: Record<Page, string> = {
  overview: 'Overview', discover: 'Find scholarships', assistant: 'Study assistant',
  applications: 'My applications', deadlines: 'Deadline calendar', vault: 'Document vault',
};
export const PAGE_PATHS: Record<Page, string> = {
  overview: '/', discover: '/discover', assistant: '/assistant', applications: '/applications', deadlines: '/deadlines', vault: '/vault',
};
export const PAGE_TITLES: Record<Page, string> = {
  overview: 'Your scholarship workspace', discover: 'Find scholarships', assistant: 'Private study assistant',
  applications: 'My applications', deadlines: 'Scholarship deadlines', vault: 'Private document vault',
};
