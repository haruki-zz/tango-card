import { sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { ReviewRating, WordExample } from '../../shared/apiTypes';

export const WORD_DEFAULT_LEVEL = 0;
export const WORD_DEFAULT_REPETITIONS = 0;
export const WORD_DEFAULT_INTERVAL = 0;
export const WORD_DEFAULT_EASE_FACTOR = 2.5;
export const SETTINGS_SINGLETON_ID = 1;
export const REVIEW_RESULTS = ['again', 'hard', 'good', 'easy'] as const;

export const words = sqliteTable('words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  term: text('term').notNull(),
  pronunciation: text('pronunciation').notNull(),
  definition_cn: text('definition_cn').notNull(),
  examplesJson: text('examples_json', { mode: 'json' }).$type<WordExample[]>().notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  srsLevel: integer('srs_level').notNull().default(WORD_DEFAULT_LEVEL),
  srsRepetitions: integer('srs_repetitions').notNull().default(WORD_DEFAULT_REPETITIONS),
  srsInterval: integer('srs_interval').notNull().default(WORD_DEFAULT_INTERVAL),
  easeFactor: real('ease_factor').notNull().default(WORD_DEFAULT_EASE_FACTOR),
  lastReviewedAt: integer('last_reviewed_at'),
  dueAt: integer('due_at')
});

export const reviewEvents = sqliteTable('review_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  wordId: integer('word_id')
    .references(() => words.id, { onDelete: 'cascade' })
    .notNull(),
  result: text('result', { enum: REVIEW_RESULTS }).$type<ReviewRating>().notNull(),
  reviewedAt: integer('reviewed_at').notNull().default(sql`(unixepoch())`),
  deltaSeconds: integer('delta_seconds')
});

export const dailyActivity = sqliteTable(
  'daily_activity',
  {
    date: integer('date').notNull(),
    wordsAddedCount: integer('words_added_count').notNull().default(0),
    reviewsDoneCount: integer('reviews_done_count').notNull().default(0)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.date] })
  })
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(SETTINGS_SINGLETON_ID),
  apiKey: text('api_key'),
  preferredModel: text('preferred_model').notNull().default('gemini-flash-2.5-lite'),
  reviewBatchSize: integer('review_batch_size').notNull().default(1),
  theme: text('theme', { enum: ['light', 'dark', 'system'] }).notNull().default('light')
});

export const schema = {
  words,
  reviewEvents,
  dailyActivity,
  settings
};
