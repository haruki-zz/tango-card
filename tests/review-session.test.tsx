import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnswerReviewResult, ExposedApi, WordCard } from '../src/shared/apiTypes';
import { ReviewSession } from '../src/renderer/features/review/ReviewSession';

const sampleCard: WordCard = {
  id: 1,
  term: '寿司',
  pronunciation: 'すし',
  definition_cn: '以醋饭和鱼类为主的日式料理。',
  examples: [
    {
      sentence_jp: '週末に友だちと寿司を食べました。',
      sentence_cn: '周末和朋友一起吃了寿司。'
    }
  ],
  tags: [],
  created_at: 1_700_000_000,
  updated_at: 1_700_000_000,
  srs_level: 0,
  srs_repetitions: 0,
  srs_interval: 0,
  ease_factor: 2.5,
  last_reviewed_at: null,
  due_at: null
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ReviewSession', () => {
  it('loads queue and accepts keyboard shortcuts for scoring', async () => {
    const user = userEvent.setup();
    const getTodayQueue = vi.fn().mockResolvedValue([sampleCard]);
    const answerReview = vi
      .fn<[Parameters<ExposedApi['db']['answerReview']>[0]], Promise<AnswerReviewResult>>()
      .mockImplementation(async (payload) => ({
        wordId: payload.wordId,
        result: payload.result,
        reviewedAt: payload.reviewedAt,
        nextDue: payload.reviewedAt + 86_400,
        level: 1,
        interval: 86_400,
        repetitions: 1,
        easeFactor: 2.5
      }));

    stubApi({ getTodayQueue, answerReview });

    render(<ReviewSession />);
    await screen.findByText('寿司');

    await user.keyboard('g');

    expect(answerReview).toHaveBeenCalledTimes(1);
    expect(answerReview).toHaveBeenCalledWith(
      expect.objectContaining({
        wordId: sampleCard.id,
        result: 'good'
      })
    );
    await screen.findByText(/已标记为 Good/);
  });

  it('allows skipping a card and treats it as Easy', async () => {
    const user = userEvent.setup();
    const getTodayQueue = vi.fn().mockResolvedValue([sampleCard]);
    const answerReview = vi
      .fn<[Parameters<ExposedApi['db']['answerReview']>[0]], Promise<AnswerReviewResult>>()
      .mockImplementation(async (payload) => ({
        wordId: payload.wordId,
        result: 'easy',
        reviewedAt: payload.reviewedAt,
        nextDue: payload.reviewedAt + 10_000,
        level: 1,
        interval: 10_000,
        repetitions: 1,
        easeFactor: 2.6
      }));

    stubApi({ getTodayQueue, answerReview });

    render(<ReviewSession />);
    await screen.findByText('寿司');

    await user.click(screen.getByRole('button', { name: /熟记，直接下一张/ }));

    expect(answerReview).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'easy'
      })
    );

    await screen.findByText(/记为 Easy/);
    await screen.findByText(/Easy 1/);
  });
});

function stubApi(options: {
  getTodayQueue: () => Promise<WordCard[]>;
  answerReview: (input: Parameters<ExposedApi['db']['answerReview']>[0]) => Promise<AnswerReviewResult>;
}) {
  const api: ExposedApi = {
    ping: () => 'pong',
    ai: {
      generateWordData: vi.fn()
    },
    db: {
      getTodayQueue: options.getTodayQueue,
      answerReview: options.answerReview,
      createWord: vi.fn()
    },
    settings: {
      getSettings: vi.fn(),
      updateSettings: vi.fn()
    },
    files: {
      importWords: vi.fn(),
      exportBackup: vi.fn()
    }
  };

  (window as unknown as { api: ExposedApi }).api = api;
}
