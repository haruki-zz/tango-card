export type ISODateString = string;

export interface Sm2State {
  repetition: number;
  interval: number;
  ef: number;
  next_review_at: ISODateString;
  last_score: number | null;
}

export interface WordEntry {
  id: string;
  word: string;
  hiragana: string;
  definition_ja: string;
  example_ja: string;
  created_at: ISODateString;
  sm2: Sm2State;
}

export interface ReviewLog {
  session_id: string;
  word_id: string;
  score: number;
  reviewed_at: ISODateString;
}

export interface ActivityDaySummary {
  added: number;
  sessions: number;
}

export type ActivityByDay = Record<string, ActivityDaySummary>;

export const SM2_EASE_FACTOR_FLOOR = 1.3;
export const SM2_DEFAULT_EF = 2.5;
export const SM2_INITIAL_INTERVAL = 1;
export const SM2_SECOND_INTERVAL = 6;
