import type { InferInsertModel } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { buildReviewQueue, REVIEW_QUEUE_LIMIT } from '../src/main/db/reviewQueueService';
import { initializeDatabase } from '../src/main/db/database';
import { schema } from '../src/main/db/schema';

type WordInsert = InferInsertModel<typeof schema.words>;

let termCounter = 0;

function buildWord(overrides: Partial<WordInsert> = {}): WordInsert {
  const now = 1_700_000_000;
  return {
    term: overrides.term ?? `word-${termCounter++}`,
    pronunciation: overrides.pronunciation ?? 'かな',
    definition_cn: overrides.definition_cn ?? '释义',
    examplesJson:
      overrides.examplesJson ??
      [
        {
          sentence_jp: '例文です',
          sentence_cn: '示例句子'
        }
      ],
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    srsLevel: overrides.srsLevel ?? 0,
    srsRepetitions: overrides.srsRepetitions ?? 0,
    srsInterval: overrides.srsInterval ?? 0,
    easeFactor: overrides.easeFactor ?? 2.5,
    lastReviewedAt: overrides.lastReviewedAt ?? null,
    dueAt: overrides.dueAt ?? null
  };
}

describe('reviewQueueService.buildReviewQueue', () => {
  it('优先返回到期卡片并按到期时间排序，再用新卡补足', async () => {
    const database = initializeDatabase(':memory:');
    const now = 10_000;

    await database.db.insert(schema.words).values(
      buildWord({
        term: 'due-late',
        dueAt: 3_000,
        lastReviewedAt: 1_000,
        srsLevel: 2
      })
    );
    await database.db.insert(schema.words).values(
      buildWord({
        term: 'due-early',
        dueAt: 1_000,
        lastReviewedAt: 500,
        srsLevel: 1
      })
    );
    await database.db.insert(schema.words).values(
      buildWord({
        term: 'due-mid',
        dueAt: 2_000,
        lastReviewedAt: 700,
        srsLevel: 1
      })
    );
    await database.db.insert(schema.words).values(
      buildWord({
        term: 'future-due',
        dueAt: 20_000,
        lastReviewedAt: 900,
        srsLevel: 2
      })
    );

    for (let i = 0; i < 4; i++) {
      await database.db.insert(schema.words).values(
        buildWord({
          term: `new-${i}`
        })
      );
    }

    const queue = await buildReviewQueue(database.db, now);
    expect(queue).toHaveLength(7);

    const terms = queue.map((card) => card.term);
    expect(terms.slice(0, 3)).toEqual(['due-early', 'due-mid', 'due-late']);
    expect(terms).not.toContain('future-due');

    const newCards = queue.slice(3);
    expect(newCards.every((card) => card.srs_level === 0 && card.last_reviewed_at === null)).toBe(
      true
    );
  });

  it('到期卡超出上限时截断为 30 条并保持到期时间升序', async () => {
    const database = initializeDatabase(':memory:');
    const now = 50_000;

    for (let i = 0; i < REVIEW_QUEUE_LIMIT + 5; i++) {
      await database.db.insert(schema.words).values(
        buildWord({
          term: `due-${i}`,
          dueAt: now - i * 10,
          lastReviewedAt: now - 10_000,
          srsLevel: 2
        })
      );
    }

    for (let i = 0; i < 10; i++) {
      await database.db.insert(schema.words).values(
        buildWord({
          term: `new-${i}`
        })
      );
    }

    const queue = await buildReviewQueue(database.db, now);

    expect(queue).toHaveLength(REVIEW_QUEUE_LIMIT);
    expect(queue.every((card) => card.term.startsWith('due-'))).toBe(true);

    const dueTimes = queue.map((card) => card.due_at ?? 0);
    const sorted = [...dueTimes].sort((a, b) => a - b);
    expect(dueTimes).toEqual(sorted);
    expect(dueTimes[0]).toBeLessThanOrEqual(now);
    expect(dueTimes[REVIEW_QUEUE_LIMIT - 1]).toBeLessThanOrEqual(now);
  });
});
