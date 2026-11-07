export type Page = 'overview' | 'discover' | 'assistant' | 'applications' | 'deadlines' | 'vault';

export type Stage = 'saved' | 'progress' | 'submitted' | 'awarded';

export type Level = 'UG' | 'PG' | 'Diploma';
export type Category = 'All' | 'SC' | 'ST' | 'OBC' | 'EWS';
export type Gender = 'F' | 'M';
export type Theme = 'dark' | 'light';
export type Filter = 'all' | 'eligible' | 'closing';
export type SortKey = 'best' | 'deadline';

export interface Profile {
  name: string;
  level: Level;
  category: Category;
  income: number;
  marks: number;
  state: string;
  gender: Gender;
  interests: string;
}

export interface Scholarship {
  id: number;
  name: string;
  org: string;
  initials: string;
  amount: string;
  /** Max annual family income in INR; a large sentinel means "no cap". */
  incomeCap: number;
  levels: Level[];
  categories: Category[];
  minMarks: number;
  state: string;
  gender?: Gender;
  deadline: string; // ISO date
  docs: string[];
  kind: string;
  tone: 'green' | 'amber' | 'violet';
  about: string;
  applyUrl: string;
}

export interface Evaluation {
  eligible: boolean;
  score: number;
  reasons: string[];
  gaps: string[];
  docsReady: number;
  docsRequired: number;
  docCompletion: number;
}

export interface AppState {
  page: Page;
  profile: Profile;
  query: string;
  filter: Filter;
  sort: SortKey;
  tracking: Record<number, Stage>;
  readyDocs: string[];
  theme: Theme;
}

export type Action =
  | { type: 'navigate'; page: Page }
  | { type: 'set-query'; query: string }
  | { type: 'set-filter'; filter: Filter }
  | { type: 'set-sort'; sort: SortKey }
  | { type: 'set-profile'; profile: Profile }
  | { type: 'track'; id: number }
  | { type: 'untrack'; id: number }
  | { type: 'move'; id: number; stage: Stage }
  | { type: 'toggle-doc'; doc: string }
  | { type: 'toggle-theme' }
  | { type: 'load-demo' }
  | { type: 'reset-demo' };

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  related?: number[];
}
