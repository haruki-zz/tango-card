import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { AnswerReviewInput, AnswerReviewResult, ReviewRating } from '../../shared/apiTypes';
import { WORD_DEFAULT_EASE_FACTOR, dailyActivity, reviewEvents, schema, words } from './schema';
import { mapWordRow } from './wordService';
import { startOfUtcDay } from './timeUtils';

const DAY_SECONDS = 86_400;
const AGAIN_INTERVAL_SECONDS = 5 * 60;
const HARD_INTERVAL_WEIGHT = 0.8;
const EASY_BONUS = 1.3;
const MIN_EASE_FACTOR = 1.3;
const MIN_INTERVAL_SECONDS = 60;

const QUALITY_MAP: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5
};

interface ScheduleResult {
  interval: number;
  repetitions: number;
  easeFactor: number;
  level: number;
  nextDue: number;
}

export function calculateNextSchedule(
  card: ReturnType<typeof mapWordRow>,
  rating: ReviewRating,
  reviewedAt: number
): ScheduleResult {
  let repetitions = card.srs_repetitions;
  let level = card.srs_level;
  let easeFactor = card.ease_factor ?? WORD_DEFAULT_EASE_FACTOR;
  let interval = Math.max(card.srs_interval, MIN_INTERVAL_SECONDS);

  if (rating === 'again') {
    repetitions = 0;
    level = 0;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
    interval = AGAIN_INTERVAL_SECONDS;
  } else {
    const quality = QUALITY_MAP[rating];
    easeFactor = Math.max(
      MIN_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    repetitions += 1;
    level = Math.max(level, repetitions);

    if (repetitions === 1) {
      interval = DAY_SECONDS;
    } else if (repetitions === 2) {
      interval = 6 * DAY_SECONDS;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    if (rating === 'hard') {
      interval = Math.max(DAY_SECONDS, Math.round(interval * HARD_INTERVAL_WEIGHT));
    } else if (rating === 'easy') {
      interval = Math.round(interval * EASY_BONUS);
      level = Math.max(level, repetitions + 1);
    }
  }

  const nextDue = reviewedAt + interval;

  return {
    interval,
    repetitions,
    easeFactor,
    level,
    nextDue
  };
}

export async function answerReview(
  db: BetterSQLite3Database<typeof schema>,
  input: AnswerReviewInput
): Promise<AnswerReviewResult> {
  const reviewedAt = input.reviewedAt ?? Math.floor(Date.now() / 1000);
  const [row] = await db.select().from(words).where(eq(words.id, input.wordId)).limit(1);

  if (!row) {
    throw new Error('要复习的单词不存在或已被删除。');
  }

  const card = mapWordRow(row);
  const schedule = calculateNextSchedule(card, input.result, reviewedAt);

  await db.transaction(async (tx) => {
    await tx
      .update(words)
      .set({
        srsLevel: schedule.level,
        srsRepetitions: schedule.repetitions,
        srsInterval: schedule.interval,
        easeFactor: schedule.easeFactor,
        lastReviewedAt: reviewedAt,
        dueAt: schedule.nextDue,
        updatedAt: reviewedAt
      })
      .where(eq(words.id, input.wordId));

    await tx.insert(reviewEvents).values({
      wordId: input.wordId,
      result: input.result,
      reviewedAt,
      deltaSeconds: input.durationSeconds ?? null
    });

    await tx
      .insert(dailyActivity)
      .values({
        date: startOfUtcDay(reviewedAt),
        wordsAddedCount: 0,
        reviewsDoneCount: 1
      })
      .onConflictDoUpdate({
        target: dailyActivity.date,
        set: {
          reviewsDoneCount: sql`${dailyActivity.reviewsDoneCount} + 1`
        }
      });
  });

  return {
    wordId: input.wordId,
    result: input.result,
    reviewedAt,
    nextDue: schedule.nextDue,
    level: schedule.level,
    interval: schedule.interval,
    repetitions: schedule.repetitions,
    easeFactor: schedule.easeFactor
  };
}
