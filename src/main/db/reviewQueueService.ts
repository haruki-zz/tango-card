import { and, asc, eq, isNull, lte, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { WordCard } from '../../shared/apiTypes';
import { schema, words } from './schema';
import { mapWordRow } from './wordService';

export const REVIEW_QUEUE_LIMIT = 30;

export async function buildReviewQueue(
  db: BetterSQLite3Database<typeof schema>,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<WordCard[]> {
  const dueRows = await db
    .select()
    .from(words)
    .where(lte(words.dueAt, nowSeconds))
    .orderBy(asc(words.dueAt))
    .limit(REVIEW_QUEUE_LIMIT);

  const dueCards = dueRows.map(mapWordRow);
  if (dueCards.length >= REVIEW_QUEUE_LIMIT) {
    return dueCards.slice(0, REVIEW_QUEUE_LIMIT);
  }

  const remaining = REVIEW_QUEUE_LIMIT - dueCards.length;
  const newRows = await db
    .select()
    .from(words)
    .where(and(eq(words.srsLevel, 0), isNull(words.lastReviewedAt)))
    .orderBy(sql`random()`)
    .limit(remaining);

  return [...dueCards, ...newRows.map(mapWordRow)];
}
