import { sql, type InferSelectModel } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import {
  CreateWordInput,
  WordCard,
  WordExample
} from '../../shared/apiTypes';
import {
  WORD_DEFAULT_EASE_FACTOR,
  WORD_DEFAULT_INTERVAL,
  WORD_DEFAULT_LEVEL,
  WORD_DEFAULT_REPETITIONS,
  dailyActivity,
  schema,
  words
} from './schema';
import { startOfUtcDay } from './timeUtils';

type WordRow = InferSelectModel<typeof words>;

export async function createWord(
  db: BetterSQLite3Database<typeof schema>,
  input: CreateWordInput
): Promise<WordCard> {
  const sanitized = sanitizeInput(input);
  const now = Math.floor(Date.now() / 1000);

  const [row] = await db
    .insert(words)
    .values({
      term: sanitized.term,
      pronunciation: sanitized.pronunciation,
      definition_cn: sanitized.definition_cn,
      examplesJson: sanitized.examples,
      tags: sanitized.tags,
      createdAt: now,
      updatedAt: now,
      srsLevel: WORD_DEFAULT_LEVEL,
      srsRepetitions: WORD_DEFAULT_REPETITIONS,
      srsInterval: WORD_DEFAULT_INTERVAL,
      easeFactor: WORD_DEFAULT_EASE_FACTOR,
      lastReviewedAt: null,
      dueAt: null
    })
    .returning();

  if (!row || !row.id) {
    throw new Error('保存单词失败，请稍后重试。');
  }

  await upsertDailyActivity(db, now);

  return mapWordRow(row);
}

function sanitizeInput(input: CreateWordInput) {
  const term = input.term.trim();
  const pronunciation = input.pronunciation.trim();
  const definition = input.definition_cn.trim();
  const examples = normalizeExamples(input.examples);
  const tags = normalizeTags(input.tags);

  if (!term || !pronunciation || !definition || examples.length === 0) {
    throw new Error('单词、读音、释义与至少一条例句不能为空。');
  }

  return {
    term,
    pronunciation,
    definition_cn: definition,
    examples,
    tags
  };
}

function normalizeExamples(examples: WordExample[]) {
  if (!Array.isArray(examples)) return [];
  return examples
    .map((item) => ({
      sentence_jp: item.sentence_jp.trim(),
      sentence_cn: item.sentence_cn.trim()
    }))
    .filter((item) => item.sentence_jp && item.sentence_cn);
}

function normalizeTags(tags: string[] | undefined) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function upsertDailyActivity(db: BetterSQLite3Database<typeof schema>, timestamp: number) {
  const dayKey = startOfUtcDay(timestamp);

  await db
    .insert(dailyActivity)
    .values({
      date: dayKey,
      wordsAddedCount: 1,
      reviewsDoneCount: 0
    })
    .onConflictDoUpdate({
      target: dailyActivity.date,
      set: {
        wordsAddedCount: sql`${dailyActivity.wordsAddedCount} + 1`
      }
    });
}

export function mapWordRow(row: WordRow): WordCard {
  return {
    id: row.id!,
    term: row.term,
    pronunciation: row.pronunciation,
    definition_cn: row.definition_cn,
    examples: row.examplesJson,
    tags: row.tags,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    srs_level: row.srsLevel,
    srs_repetitions: row.srsRepetitions,
    srs_interval: row.srsInterval,
    ease_factor: row.easeFactor,
    last_reviewed_at: row.lastReviewedAt ?? null,
    due_at: row.dueAt ?? null
  };
}
