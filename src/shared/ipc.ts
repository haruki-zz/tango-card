import type { ActivityByDay, ReviewLog, Sm2State, WordEntry } from './types';

export const IPC_CHANNELS = {
  LIST_WORDS: 'words:list',
  ADD_WORD: 'words:add',
  GENERATE_WORD: 'words:generate',
  REVIEW_QUEUE: 'reviews:queue',
  SUBMIT_REVIEW: 'reviews:submit',
  ACTIVITY_GET: 'activity:get',
  ACTIVITY_INCREMENT_SESSION: 'activity:increment-session',
  SET_PROVIDER: 'config:set-provider',
  EXPORT_DATA: 'data:export',
  IMPORT_DATA: 'data:import',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export type ProviderName = 'openai' | 'gemini' | 'mock';

export interface ProviderSettings {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
}

export type SafeProviderSettings = Omit<ProviderSettings, 'apiKey'>;

export interface GenerateWordPayload {
  word: string;
  maxOutputChars?: number;
}

export type GeneratedWordContent = Pick<
  WordEntry,
  'hiragana' | 'definition_ja' | 'example_ja'
>;

export interface AddWordPayload {
  id: string;
  word: string;
  hiragana: string;
  definition_ja: string;
  example_ja: string;
  created_at?: string;
  sm2?: Partial<Sm2State>;
}

export interface ReviewSubmitPayload {
  wordId: string;
  sessionId: string;
  score: number;
}

export interface ImportDataPayload {
  content: string;
  format: 'json' | 'jsonl' | 'csv';
}

export interface ExportDataResponse {
  path: string;
}

export interface ImportDataResponse {
  imported: number;
  skipped: number;
}

export interface RendererApi {
  generateWordContent(payload: GenerateWordPayload): Promise<GeneratedWordContent>;
  addWord(payload: AddWordPayload): Promise<WordEntry>;
  listWords(): Promise<WordEntry[]>;
  getReviewQueue(): Promise<WordEntry[]>;
  submitReview(
    payload: ReviewSubmitPayload
  ): Promise<{ word: WordEntry; log: ReviewLog }>;
  getActivity(): Promise<ActivityByDay>;
  incrementSession(date?: string): Promise<ActivityByDay>;
  setProvider(config: ProviderSettings): Promise<SafeProviderSettings>;
  exportData(): Promise<ExportDataResponse>;
  importData(payload: ImportDataPayload): Promise<ImportDataResponse>;
}

export interface IpcRequestMap {
  [IPC_CHANNELS.LIST_WORDS]: void;
  [IPC_CHANNELS.ADD_WORD]: AddWordPayload;
  [IPC_CHANNELS.GENERATE_WORD]: GenerateWordPayload;
  [IPC_CHANNELS.REVIEW_QUEUE]: void;
  [IPC_CHANNELS.SUBMIT_REVIEW]: ReviewSubmitPayload;
  [IPC_CHANNELS.ACTIVITY_GET]: void;
  [IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION]: { date?: string };
  [IPC_CHANNELS.SET_PROVIDER]: ProviderSettings;
  [IPC_CHANNELS.EXPORT_DATA]: void;
  [IPC_CHANNELS.IMPORT_DATA]: ImportDataPayload;
}

export interface IpcResponseMap {
  [IPC_CHANNELS.LIST_WORDS]: WordEntry[];
  [IPC_CHANNELS.ADD_WORD]: WordEntry;
  [IPC_CHANNELS.GENERATE_WORD]: GeneratedWordContent;
  [IPC_CHANNELS.REVIEW_QUEUE]: WordEntry[];
  [IPC_CHANNELS.SUBMIT_REVIEW]: { word: WordEntry; log: ReviewLog };
  [IPC_CHANNELS.ACTIVITY_GET]: ActivityByDay;
  [IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION]: ActivityByDay;
  [IPC_CHANNELS.SET_PROVIDER]: SafeProviderSettings;
  [IPC_CHANNELS.EXPORT_DATA]: ExportDataResponse;
  [IPC_CHANNELS.IMPORT_DATA]: ImportDataResponse;
}
