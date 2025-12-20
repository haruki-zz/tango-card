import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/main/db/database';

describe('database schema', () => {
  it('applies default values for words table', () => {
    const context = initializeDatabase(':memory:');

    try {
      context.sqlite
        .prepare(
          `INSERT INTO words (term, pronunciation, definition_cn) VALUES (?, ?, ?)`
        )
        .run('寿司', 'すし', '以醋饭和鱼类为主的日式料理');

      const row = context.sqlite
        .prepare(
          `SELECT tags, examples_json, srs_level, srs_repetitions, srs_interval, ease_factor, last_reviewed_at, due_at, created_at, updated_at FROM words LIMIT 1`
        )
        .get();

      expect(row.tags).toBe('[]');
      expect(row.examples_json).toBe('[]');
      expect(row.srs_level).toBe(0);
      expect(row.srs_repetitions).toBe(0);
      expect(row.srs_interval).toBe(0);
      expect(row.ease_factor).toBeCloseTo(2.5);
      expect(typeof row.created_at).toBe('number');
      expect(typeof row.updated_at).toBe('number');
      expect(row.last_reviewed_at).toBeNull();
      expect(row.due_at).toBeNull();
    } finally {
      context.sqlite.close();
    }
  });

  it('seeds singleton settings row with defaults', () => {
    const context = initializeDatabase(':memory:');

    try {
      const settings = context.sqlite
        .prepare('SELECT * FROM settings WHERE id = 1')
        .get();

      expect(settings.api_key).toBeNull();
      expect(settings.preferred_model).toBe('gemini-flash-2.5-lite');
      expect(settings.review_batch_size).toBe(1);
      expect(settings.theme).toBe('light');
    } finally {
      context.sqlite.close();
    }
  });

  it('enforces review result enum and daily activity defaults', () => {
    const context = initializeDatabase(':memory:');

    try {
      const insertWord = context.sqlite
        .prepare(
          `INSERT INTO words (term, pronunciation, definition_cn) VALUES (?, ?, ?)`
        )
        .run('雨', 'あめ', '雨水，天气现象');

      const wordId = Number(insertWord.lastInsertRowid);

      expect(() =>
        context.sqlite
          .prepare(
            `INSERT INTO review_events (word_id, result, reviewed_at) VALUES (?, ?, ?)`
          )
          .run(wordId, 'invalid', 1000)
      ).toThrow();

      const validEvent = context.sqlite
        .prepare(
          `INSERT INTO review_events (word_id, result) VALUES (?, ?)`
        )
        .run(wordId, 'good');

      const storedEvent = context.sqlite
        .prepare('SELECT reviewed_at FROM review_events WHERE id = ?')
        .get(validEvent.lastInsertRowid);

      expect(typeof storedEvent.reviewed_at).toBe('number');

      context.sqlite
        .prepare(`INSERT INTO daily_activity (date) VALUES (?)`)
        .run(1_700_000_000);

      const activity = context.sqlite
        .prepare(
          `SELECT words_added_count, reviews_done_count FROM daily_activity WHERE date = ?`
        )
        .get(1_700_000_000);

      expect(activity.words_added_count).toBe(0);
      expect(activity.reviews_done_count).toBe(0);
    } finally {
      context.sqlite.close();
    }
  });
});
