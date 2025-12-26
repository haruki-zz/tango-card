import {
  ActivityByDay,
  ActivityDaySummary,
  ReviewLog,
  Sm2State,
  WordEntry,
  SM2_DEFAULT_EF,
  SM2_EASE_FACTOR_FLOOR,
  SM2_INITIAL_INTERVAL,
} from './types';
import { calculateNextReviewAt, createDefaultSm2 } from './sm2';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isIsoDateString = (value: string) => Number.isFinite(Date.parse(value));

const assertNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} 必须是非空字符串`);
  }
  return value;
};

const toNonNegativeInteger = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
};

const toPositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
};

const normalizeIsoDate = (value: unknown, now: Date) => {
  if (typeof value === 'string' && isIsoDateString(value)) {
    return value;
  }
  return now.toISOString();
};

const normalizeScore = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new Error('score 必须在 0-5 之间');
  }
  return Math.floor(value);
};

export const normalizeSm2 = (raw: unknown, now = new Date()): Sm2State => {
  if (!isRecord(raw)) {
    return createDefaultSm2(now);
  }

  const sm2 = raw as Partial<Sm2State>;
  const repetition = toNonNegativeInteger(sm2.repetition, 0);
  const interval = toPositiveInteger(sm2.interval, SM2_INITIAL_INTERVAL);
  const ef =
    typeof sm2.ef === 'number' && Number.isFinite(sm2.ef)
      ? Math.max(SM2_EASE_FACTOR_FLOOR, sm2.ef)
      : SM2_DEFAULT_EF;

  const lastScore =
    sm2.last_score === null
      ? null
      : typeof sm2.last_score === 'number' &&
          Number.isFinite(sm2.last_score) &&
          sm2.last_score >= 0 &&
          sm2.last_score <= 5
        ? Math.floor(sm2.last_score)
        : null;

  const nextReview =
    typeof sm2.next_review_at === 'string' && isIsoDateString(sm2.next_review_at)
      ? sm2.next_review_at
      : calculateNextReviewAt(interval, now);

  return {
    repetition,
    interval,
    ef,
    next_review_at: nextReview,
    last_score: lastScore,
  };
};

export const normalizeWordRecord = (input: unknown, now = new Date()): WordEntry => {
  if (!isRecord(input)) {
    throw new Error('词条必须是对象');
  }

  const createdAt = normalizeIsoDate(input.created_at, now);
  const sm2 = normalizeSm2(input.sm2, now);

  return {
    id: assertNonEmptyString(input.id, 'id'),
    word: assertNonEmptyString(input.word, 'word'),
    hiragana: assertNonEmptyString(input.hiragana, 'hiragana'),
    definition_ja: assertNonEmptyString(input.definition_ja, 'definition_ja'),
    example_ja: assertNonEmptyString(input.example_ja, 'example_ja'),
    created_at: createdAt,
    sm2,
  };
};

export const normalizeReviewLog = (input: unknown, now = new Date()): ReviewLog => {
  if (!isRecord(input)) {
    throw new Error('复习日志必须是对象');
  }

  return {
    session_id: assertNonEmptyString(input.session_id, 'session_id'),
    word_id: assertNonEmptyString(input.word_id, 'word_id'),
    score: normalizeScore(input.score),
    reviewed_at: normalizeIsoDate(input.reviewed_at, now),
  };
};

const normalizeActivityDay = (value: unknown, day: string): ActivityDaySummary => {
  if (!isRecord(value)) {
    throw new Error(`活跃度 ${day} 必须是对象`);
  }

  const added = toNonNegativeInteger(value.added, Number.NaN);
  const sessions = toNonNegativeInteger(value.sessions, Number.NaN);

  if (!Number.isFinite(added) || !Number.isFinite(sessions)) {
    throw new Error(`活跃度 ${day} 缺少有效数字`);
  }

  return {
    added,
    sessions,
  };
};

export const validateActivityByDay = (input: unknown): ActivityByDay => {
  if (!isRecord(input)) {
    throw new Error('活跃度数据必须是对象');
  }

  const activity: ActivityByDay = {};
  Object.entries(input).forEach(([day, value]) => {
    activity[day] = normalizeActivityDay(value, day);
  });

  return activity;
};
