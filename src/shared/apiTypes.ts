export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface WordExample {
  sentence_jp: string;
  sentence_cn: string;
}

export interface WordData {
  term: string;
  pronunciation: string;
  definition_cn: string;
  examples: WordExample[];
}

export interface CreateWordInput {
  term: string;
  pronunciation: string;
  definition_cn: string;
  examples: WordExample[];
  tags?: string[];
}

export interface WordCard extends WordData {
  id: number;
  tags: string[];
  created_at: number;
  updated_at: number;
  srs_level: number;
  srs_repetitions: number;
  srs_interval: number;
  ease_factor: number;
  last_reviewed_at: number | null;
  due_at: number | null;
}

export type GenerateWordDataResult =
  | { ok: true; data: WordData }
  | { ok: false; error: { code: string; message: string; detail?: string } };

export interface AnswerReviewInput {
  wordId: number;
  result: ReviewRating;
  reviewedAt: number;
  durationSeconds?: number;
}

export interface AnswerReviewResult {
  wordId: number;
  result: ReviewRating;
  nextDue: number;
  level: number;
}

export interface AppSettings {
  apiKey: string | null;
  preferredModel: string;
  reviewBatchSize: number;
  theme: 'light' | 'dark' | 'system';
}

export interface ImportResult {
  imported: number;
  skipped: number;
  message?: string;
}

export interface ExportResult {
  filePath: string;
  count: number;
  exportedAt: number;
}

export interface AiApi {
  generateWordData: (term: string) => Promise<GenerateWordDataResult>;
}

export interface DbApi {
  getTodayQueue: () => Promise<WordCard[]>;
  answerReview: (input: AnswerReviewInput) => Promise<AnswerReviewResult>;
  createWord: (input: CreateWordInput) => Promise<WordCard>;
}

export interface SettingsApi {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
}

export interface FilesApi {
  importWords: (filePath: string) => Promise<ImportResult>;
  exportBackup: () => Promise<ExportResult>;
}

export interface ExposedApi {
  ping: () => string;
  ai: AiApi;
  db: DbApi;
  settings: SettingsApi;
  files: FilesApi;
}
