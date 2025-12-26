import { describe, expect, it } from 'vitest';

import { buildReviewQueue, createDefaultSm2, updateSm2 } from '@shared/sm2';
import { WordEntry } from '@shared/types';

const buildWord = (id: string, nextReviewAt: string): WordEntry => ({
  id,
  word: `word-${id}`,
  hiragana: 'かな',
  definition_ja: '定義',
  example_ja: '例文',
  created_at: '2025-01-01T00:00:00.000Z',
  sm2: {
    ...createDefaultSm2(new Date('2025-01-01T00:00:00Z')),
    next_review_at: nextReviewAt,
  },
});

describe('updateSm2', () => {
  it('低分时重置重复次数并使用最小间隔', () => {
    const now = new Date('2025-03-01T12:00:00Z');
    const updated = updateSm2(
      {
        repetition: 2,
        interval: 6,
        ef: 1.4,
        next_review_at: '2025-02-28T00:00:00Z',
        last_score: 5,
      },
      2,
      now
    );

    expect(updated).toEqual({
      repetition: 0,
      interval: 1,
      ef: 1.4,
      next_review_at: '2025-03-02T12:00:00.000Z',
      last_score: 2,
    });
  });

  it('高分时累积重复次数并根据 EF 推进间隔', () => {
    const now = new Date('2025-03-01T12:00:00Z');
    const firstPass = updateSm2(
      {
        repetition: 1,
        interval: 1,
        ef: 2.5,
        next_review_at: '2025-02-28T00:00:00Z',
        last_score: 4,
      },
      5,
      now
    );

    expect(firstPass.repetition).toBe(2);
    expect(firstPass.interval).toBe(6);
    expect(firstPass.next_review_at).toBe('2025-03-07T12:00:00.000Z');
    expect(firstPass.ef).toBeGreaterThan(2.5);

    const secondPass = updateSm2(firstPass, 4, now);
    expect(secondPass.repetition).toBe(3);
    expect(secondPass.interval).toBe(16);
    expect(secondPass.next_review_at).toBe('2025-03-17T12:00:00.000Z');
  });

  it('分数越界时抛出错误', () => {
    expect(() =>
      updateSm2(
        {
          repetition: 0,
          interval: 1,
          ef: 2.5,
          next_review_at: '2025-03-02T00:00:00Z',
          last_score: null,
        },
        7
      )
    ).toThrow(/score 必须在 0-5 之间/);
  });
});

describe('buildReviewQueue', () => {
  it('优先返回到期词条并按 next_review_at 排序', () => {
    const now = new Date('2025-01-10T00:00:00Z');
    const queue = buildReviewQueue(
      [
        buildWord('due-1', '2025-01-09T12:00:00Z'),
        buildWord('future-1', '2025-01-10T12:00:00Z'),
        buildWord('future-2', '2025-02-01T00:00:00Z'),
        buildWord('due-2', '2025-01-08T00:00:00Z'),
      ],
      now
    );

    expect(queue.map((word) => word.id)).toEqual([
      'due-2',
      'due-1',
      'future-1',
      'future-2',
    ]);
  });
});
