export type Page = 'overview' | 'discover' | 'assistant' | 'applications' | 'deadlines' | 'vault';
export type Stage = 'saved' | 'progress' | 'submitted' | 'awarded';
export type Level = 'UG' | 'PG' | 'Diploma';
export type Category = 'All' | 'General' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'EBC' | 'DNT';
export type Gender = 'F' | 'M' | 'Other' | 'Unspecified';
export type Theme = 'dark' | 'light';
export type FundingType = 'grant' | 'loan';

export type DocumentId =
  | 'Aadhaar' | 'Income certificate' | 'Caste certificate' | 'Category certificate'
  | 'Marksheet' | 'Class 12 marksheet' | 'Residence certificate' | 'Bank passbook'
  | 'Admission letter' | 'Fee receipt' | 'Statement of purpose' | 'Offer letter'
  | 'Passport' | 'Graduation certificate' | 'Disability certificate' | 'UDID card'
  | 'Minority declaration' | 'Institution verification' | 'Previous scholarship details';

export interface Profile {
  name: string;
  level: Level;
  category: Category;
  income: number | null;
  marks: number | null;
  state: string;
  gender: Gender;
  interests: string;
  disability: boolean | null;
  minority: boolean | null;
  complete: boolean;
}

export interface Scholarship {
  id: number;
  slug: string;
  name: string;
  org: string;
  initials: string;
  /** Annual award in INR, or null when a single comparable value is not published. */
  amount: number | null;
  awardLabel: string;
  fundingType: FundingType;
  incomeCap: number | null;
  levels: Level[];
  categories: Category[];
  minMarks: number | null;
  state: string;
  gender?: Gender;
  requiresDisability?: boolean;
  requiresMinority?: boolean;
  /** Percentile is not interchangeable with aggregate marks. */
  requiresAbove80Percentile?: boolean;
  applicationType: 'fresh' | 'renewal' | 'both';
  /** A published calendar date, never generated. Null means not verified. */
  deadline: string | null;
  opensAt: string | null;
  deadlineNote: string;
  docs: DocumentId[];
  kind: string;
  tone: 'green' | 'amber' | 'violet';
  about: string;
  conditions: string[];
  applyUrl: string;
  sourceUrl: string;
  guidelinesUrl: string | null;
  verifiedAt: string;
}

export interface CatalogSnapshot {
  schemaVersion: 1;
  verifiedAt: string;
  timezone: string;
  scholarships: Scholarship[];
}

export interface Evaluation {
  eligible: boolean;
  score: number;
  reasons: string[];
  gaps: string[];
  unknowns: string[];
  docsReady: number;
  docsRequired: number;
  docCompletion: number;
}

export interface AppState {
  profile: Profile;
  tracking: Record<number, Stage>;
  readyDocs: DocumentId[];
  notes: Record<number, string>;
  reminders: Record<number, string>;
  theme: Theme;
  tourSeen: boolean;
}

export type Action =
  | { type: 'set-profile'; profile: Profile }
  | { type: 'track'; id: number }
  | { type: 'untrack'; id: number }
  | { type: 'move'; id: number; stage: Stage }
  | { type: 'toggle-doc'; doc: DocumentId }
  | { type: 'set-note'; id: number; note: string }
  | { type: 'set-reminder'; id: number; date: string }
  | { type: 'toggle-theme' }
  | { type: 'see-tour' }
  | { type: 'load-demo' }
  | { type: 'restore'; data: PersistedData }
  | { type: 'clear-data' };

export interface PersistedData {
  profile: Profile;
  tracking: Record<number, Stage>;
  readyDocs: DocumentId[];
  notes: Record<number, string>;
  reminders: Record<number, string>;
  theme: Theme;
  tourSeen: boolean;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  related?: number[];
}
