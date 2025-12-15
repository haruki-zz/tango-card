import {
  ActivityLog,
  ActivityLogDraft,
  buildActivityLog,
  buildReviewEvent,
  buildWordEntry,
  ReviewEvent,
  ReviewEventDraft,
  WordEntry,
  WordEntryDraft,
} from "../types";

export interface WordRow {
  id: string;
  surface: string;
  reading: string;
  meaning_zh: string;
  example_ja: string;
  familiarity: string;
  review_count: number;
  last_reviewed_at: string;
  created_at: string;
  updated_at: string;
  ai_model: string | null;
  ai_prompt_hash: string | null;
}

export const mapWordRowToEntry = (row: WordRow): WordEntry =>
  buildWordEntry({
    id: row.id,
    surface: row.surface,
    reading: row.reading,
    meaningZh: row.meaning_zh,
    exampleJa: row.example_ja,
    familiarity: row.familiarity,
    reviewCount: Number(row.review_count),
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    aiMeta: row.ai_model
      ? { model: row.ai_model, promptHash: row.ai_prompt_hash ?? undefined }
      : undefined,
  });

export interface ReviewEventRow {
  id: string;
  word_id: string;
  result: string;
  timestamp: string;
}

export const mapReviewEventRow = (row: ReviewEventRow): ReviewEvent =>
  buildReviewEvent({
    id: row.id,
    wordId: row.word_id,
    result: row.result,
    timestamp: row.timestamp,
  } as ReviewEventDraft);

export interface ActivityLogRow {
  date: string;
  add_count: number;
  review_count: number;
}

export const mapActivityLogRow = (row: ActivityLogRow): ActivityLog =>
  buildActivityLog({
    date: row.date,
    addCount: Number(row.add_count),
    reviewCount: Number(row.review_count),
  } as ActivityLogDraft);
