import { eq, type InferInsertModel } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/main/db/database';
import { answerReview } from '../src/main/db/reviewService';
import { schema } from '../src/main/db/schema';
import { startOfUtcDay } from '../src/main/db/timeUtils';

type WordInsert = InferInsertModel<typeof schema.words>;

const baseWord: WordInsert = {
  term: '桜',
  pronunciation: 'さくら',
  definition_cn: '樱花。',
  examplesJson: [
    {
      sentence_jp: '春になると桜が咲きます。',
      sentence_cn: '一到春天樱花就会盛开。'
    }
  ],
  tags: [],
  createdAt: 1_699_999_000,
  updatedAt: 1_699_999_000,
  srsLevel: 0,
  srsRepetitions: 0,
  srsInterval: 0,
  easeFactor: 2.5,
  lastReviewedAt: null,
  dueAt: null
};

describe('reviewService.answerReview', () => {
  it('updates SRS fields, due date, review events and daily activity for successful review', async () => {
    const db = initializeDatabase(':memory:');
    const reviewedAt = 1_700_000_000;

    try {
      const [inserted] = await db.db.insert(schema.words).values(baseWord).returning();
      const wordId = inserted.id!;

      const result = await answerReview(db.db, {
        wordId,
        result: 'good',
        reviewedAt,
        durationSeconds: 12
      });

      expect(result.wordId).toBe(wordId);
      expect(result.level).toBe(1);
      expect(result.interval).toBe(86_400);
      expect(result.nextDue).toBe(reviewedAt + 86_400);
      expect(result.repetitions).toBe(1);
      expect(result.easeFactor).toBeCloseTo(2.5);

      const [row] = await db.db.select().from(schema.words).where(eq(schema.words.id, wordId));
      expect(row?.dueAt).toBe(result.nextDue);
      expect(row?.lastReviewedAt).toBe(reviewedAt);
      expect(row?.srsLevel).toBe(1);
      expect(row?.srsRepetitions).toBe(1);
      expect(row?.srsInterval).toBe(86_400);

      const [event] = await db.db.select().from(schema.reviewEvents);
      expect(event?.wordId).toBe(wordId);
      expect(event?.result).toBe('good');
      expect(event?.deltaSeconds).toBe(12);

      const dayKey = startOfUtcDay(reviewedAt);
      const [activity] = await db.db
        .select()
        .from(schema.dailyActivity)
        .where(eq(schema.dailyActivity.date, dayKey));
      expect(activity?.reviewsDoneCount).toBe(1);
    } finally {
      db.sqlite.close();
    }
  });

  it('resets progress and shortens interval when rating Again', async () => {
    const db = initializeDatabase(':memory:');

    try {
      const [inserted] = await db.db
        .insert(schema.words)
        .values({
          ...baseWord,
          srsLevel: 3,
          srsRepetitions: 3,
          srsInterval: 200_000,
          easeFactor: 2.3
        })
        .returning();
      const wordId = inserted.id!;
      const reviewedAt = 2_000;

      const result = await answerReview(db.db, {
        wordId,
        result: 'again',
        reviewedAt
      });

      expect(result.level).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(300);
      expect(result.nextDue).toBe(reviewedAt + 300);
      expect(result.easeFactor).toBeCloseTo(2.1);

      const [row] = await db.db.select().from(schema.words).where(eq(schema.words.id, wordId));
      expect(row?.srsLevel).toBe(0);
      expect(row?.srsRepetitions).toBe(0);
      expect(row?.dueAt).toBe(result.nextDue);
      expect(row?.lastReviewedAt).toBe(reviewedAt);
    } finally {
      db.sqlite.close();
    }
  });
});
