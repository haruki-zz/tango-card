import { describe, expect, it, vi } from 'vitest';

import {
  normalizeReviewLog,
  normalizeSm2,
  normalizeWordRecord,
  validateActivityByDay,
} from '@shared/validation';

describe('normalizeWordRecord', () => {
  it('补全缺失的时间与 sm2 默认值', () => {
    const now = new Date('2025-01-15T10:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const record = normalizeWordRecord({
      id: 'w1',
      word: '勉強',
      hiragana: 'べんきょう',
      definition_ja: '学ぶこと',
      example_ja: '図書館で勉強する。',
    });

    expect(record.created_at).toBe('2025-01-15T10:00:00.000Z');
    expect(record.sm2.repetition).toBe(0);
    expect(record.sm2.interval).toBe(1);
    expect(record.sm2.ef).toBe(2.5);
    expect(record.sm2.last_score).toBeNull();
    expect(record.sm2.next_review_at).toBe('2025-01-16T10:00:00.000Z');

    vi.useRealTimers();
  });

  it('规范化 sm2 字段并为无效时间补全默认值', () => {
    const now = new Date('2025-01-15T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const record = normalizeWordRecord({
      id: 'w2',
      word: '猫',
      hiragana: 'ねこ',
      definition_ja: '動物',
      example_ja: '猫が好きです。',
      created_at: '2024-12-01T00:00:00Z',
      sm2: {
        repetition: 3,
        interval: -5,
        ef: 1,
        next_review_at: 'not-a-date',
        last_score: 10,
      },
    });

    expect(record.created_at).toBe('2024-12-01T00:00:00Z');
    expect(record.sm2).toMatchObject({
      repetition: 3,
      interval: 1,
      ef: 1.3,
      last_score: null,
    });
    expect(record.sm2.next_review_at).toBe('2025-01-16T00:00:00.000Z');

    vi.useRealTimers();
  });
});

describe('normalizeReviewLog', () => {
  it('默认补全 reviewed_at 并验证 score 范围', () => {
    const now = new Date('2025-02-01T08:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const log = normalizeReviewLog({
      session_id: 's1',
      word_id: 'w1',
      score: 4,
    });

    expect(log).toEqual({
      session_id: 's1',
      word_id: 'w1',
      score: 4,
      reviewed_at: '2025-02-01T08:00:00.000Z',
    });

    expect(() =>
      normalizeReviewLog({ session_id: 's1', word_id: 'w1', score: 9 }),
    ).toThrow(/score 必须在 0-5 之间/);

    vi.useRealTimers();
  });
});

describe('normalizeSm2', () => {
  it('缺失字段时使用默认 sm2 值', () => {
    const now = new Date('2025-01-10T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const sm2 = normalizeSm2({});
    expect(sm2).toEqual({
      repetition: 0,
      interval: 1,
      ef: 2.5,
      next_review_at: '2025-01-11T00:00:00.000Z',
      last_score: null,
    });

    vi.useRealTimers();
  });
});

describe('validateActivityByDay', () => {
  it('验证活跃度数字并保持原键', () => {
    const activity = validateActivityByDay({
      '2025-01-01': { added: 2, sessions: 1 },
      '2025-01-02': { added: 0, sessions: 0 },
    });

    expect(activity).toEqual({
      '2025-01-01': { added: 2, sessions: 1 },
      '2025-01-02': { added: 0, sessions: 0 },
    });

    expect(() =>
      validateActivityByDay({
        '2025-01-03': { added: 'bad', sessions: 1 },
      }),
    ).toThrow(/活跃度 2025-01-03 缺少有效数字/);
  });
});
