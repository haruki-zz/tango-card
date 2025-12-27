import {
  SM2_DEFAULT_EF,
  SM2_EASE_FACTOR_FLOOR,
  SM2_INITIAL_INTERVAL,
  SM2_SECOND_INTERVAL,
  Sm2State,
  WordEntry,
} from './types';

const toIsoString = (date: Date) => date.toISOString();

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const calculateNextReviewAt = (interval: number, now = new Date()) => {
  const normalizedInterval = Math.max(
    SM2_INITIAL_INTERVAL,
    Math.round(interval),
  );
  return toIsoString(addDays(now, normalizedInterval));
};

export const createDefaultSm2 = (now = new Date()): Sm2State => ({
  repetition: 0,
  interval: SM2_INITIAL_INTERVAL,
  ef: SM2_DEFAULT_EF,
  next_review_at: calculateNextReviewAt(SM2_INITIAL_INTERVAL, now),
  last_score: null,
});

const updateEaseFactor = (current: number, score: number) => {
  const nextEf = current + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  return Math.max(SM2_EASE_FACTOR_FLOOR, nextEf);
};

export const updateSm2 = (
  state: Sm2State,
  score: number,
  now = new Date(),
): Sm2State => {
  if (!Number.isFinite(score) || score < 0 || score > 5) {
    throw new Error('score 必须在 0-5 之间');
  }

  if (score < 3) {
    return {
      repetition: 0,
      interval: SM2_INITIAL_INTERVAL,
      ef: Math.max(SM2_EASE_FACTOR_FLOOR, state.ef),
      next_review_at: calculateNextReviewAt(SM2_INITIAL_INTERVAL, now),
      last_score: score,
    };
  }

  const ef = updateEaseFactor(state.ef, score);
  const repetition = state.repetition + 1;

  let interval: number;
  if (repetition === 1) {
    interval = SM2_INITIAL_INTERVAL;
  } else if (repetition === 2) {
    interval = SM2_SECOND_INTERVAL;
  } else {
    interval = Math.max(SM2_INITIAL_INTERVAL, Math.round(state.interval * ef));
  }

  return {
    repetition,
    interval,
    ef,
    next_review_at: calculateNextReviewAt(interval, now),
    last_score: score,
  };
};

const safeTime = (iso: string, fallback: number) => {
  const ts = Date.parse(iso);
  return Number.isNaN(ts) ? fallback : ts;
};

export const buildReviewQueue = (
  words: WordEntry[],
  now = new Date(),
): WordEntry[] => {
  const nowTime = now.getTime();
  const due: Array<{ word: WordEntry; ts: number }> = [];
  const upcoming: Array<{ word: WordEntry; ts: number }> = [];

  words.forEach((word) => {
    const ts = safeTime(word.sm2.next_review_at, nowTime);
    if (ts <= nowTime) {
      due.push({ word, ts });
      return;
    }
    upcoming.push({ word, ts });
  });

  due.sort((a, b) => a.ts - b.ts);
  upcoming.sort((a, b) => a.ts - b.ts);

  return [...due, ...upcoming].map((item) => item.word);
};
