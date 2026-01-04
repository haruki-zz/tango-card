import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RendererApi } from '@shared/ipc';
import type { ReviewLog, WordEntry } from '@shared/types';

import App from '../App';
import { useAppStore } from '../store/useAppStore';

type ApiMock = RendererApi & {
  listWords: ReturnType<typeof vi.fn>;
  addWord: ReturnType<typeof vi.fn>;
  generateWordContent: ReturnType<typeof vi.fn>;
  getReviewQueue: ReturnType<typeof vi.fn>;
  submitReview: ReturnType<typeof vi.fn>;
  getActivity: ReturnType<typeof vi.fn>;
  incrementSession: ReturnType<typeof vi.fn>;
  getProvider: ReturnType<typeof vi.fn>;
  setProvider: ReturnType<typeof vi.fn>;
  exportData: ReturnType<typeof vi.fn>;
  importData: ReturnType<typeof vi.fn>;
};

const createApiMock = (): ApiMock =>
  ({
    generateWordContent: vi.fn(),
    addWord: vi.fn(),
    listWords: vi.fn(),
    getReviewQueue: vi.fn(),
    submitReview: vi.fn(),
    getActivity: vi.fn(),
    incrementSession: vi.fn(),
    getProvider: vi.fn(),
    setProvider: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
  }) as ApiMock;

const setRendererApi = (api: RendererApi) => {
  (window as unknown as { api: RendererApi }).api = api;
};

const makeWord = (overrides: Partial<WordEntry> = {}): WordEntry => ({
  id: 'word-1',
  word: '復習',
  hiragana: 'ふくしゅう',
  definition_ja: '学んだことを再度確認すること。',
  example_ja: '試験前にノートを見返して復習した。',
  created_at: new Date().toISOString(),
  sm2: {
    repetition: 0,
    interval: 1,
    ef: 2.5,
    next_review_at: new Date(Date.now() + 86_400_000).toISOString(),
    last_score: null,
  },
  ...overrides,
});

describe('复习队列', () => {
  let api: ApiMock;
  let randomIdSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    api = createApiMock();
    setRendererApi(api);
    api.listWords.mockResolvedValue([]);
    api.getActivity.mockResolvedValue({});
    api.getProvider.mockResolvedValue({ provider: 'mock', hasKey: false });
    randomIdSpy = vi.spyOn(global.crypto, 'randomUUID').mockReturnValue('session-review');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    randomIdSpy?.mockRestore();
    useAppStore.setState({
      words: [],
      reviewQueue: [],
      activity: {},
      provider: null,
      sessionId: null,
    });
  });

  it('翻转卡片后显示释义与例句', async () => {
    const word = makeWord();
    api.getReviewQueue.mockResolvedValue([word]);

    render(<App />);

    await screen.findByText('SM-2 复习队列');
    expect(screen.queryByText(word.definition_ja)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('查看释义'));

    expect(await screen.findByText(word.definition_ja)).toBeInTheDocument();
    expect(screen.getByText(word.example_ja)).toBeInTheDocument();
  });

  it('评分后提交 IPC 并完成 session 计数', async () => {
    const word = makeWord({ id: 'word-review' });
    const updated = {
      ...word,
      sm2: {
        ...word.sm2,
        repetition: 1,
        interval: 6,
        last_score: 4,
        next_review_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      },
    };
    const log: ReviewLog = {
      session_id: 'session-review',
      word_id: word.id,
      score: 4,
      reviewed_at: new Date().toISOString(),
    };
    api.getReviewQueue.mockResolvedValue([word]);
    api.submitReview.mockResolvedValue({ word: updated, log });
    api.incrementSession.mockResolvedValue({
      [updated.sm2.next_review_at.slice(0, 10)]: { added: 0, sessions: 1 },
    });

    render(<App />);

    await screen.findByText(word.word);
    fireEvent.click(screen.getByText('查看释义'));
    fireEvent.click(screen.getByLabelText('评分 4 较熟练'));

    await waitFor(() =>
      expect(api.submitReview).toHaveBeenCalledWith({
        wordId: word.id,
        score: 4,
        sessionId: 'session-review',
      }),
    );
    await waitFor(() => expect(api.incrementSession).toHaveBeenCalledTimes(1));
    expect(api.getReviewQueue).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/复习已完成/)).toBeInTheDocument();
  });

  it('展示进度并支持左右箭头切换当前卡片', async () => {
    const first = makeWord({ id: 'first', word: '復習' });
    const second = makeWord({ id: 'second', word: '勉強' });
    api.getReviewQueue.mockResolvedValue([first, second]);
    api.submitReview.mockImplementation(async ({ wordId, score }) => {
      const chosen = wordId === second.id ? second : first;
      return {
        word: { ...chosen, sm2: { ...chosen.sm2, last_score: score } },
        log: {
          session_id: 'session-review',
          word_id: chosen.id,
          score,
          reviewed_at: new Date().toISOString(),
        },
      };
    });

    render(<App />);

    await screen.findByText(first.word);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText(second.word)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(await screen.findByText(first.word)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('评分 4 较熟练'));
    await waitFor(() =>
      expect(api.submitReview).toHaveBeenCalledWith({
        wordId: first.id,
        score: 4,
        sessionId: 'session-review',
      }),
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText(/1 \/ 2 已计入/)).toBeInTheDocument();
    expect(api.incrementSession).not.toHaveBeenCalled();
  });

  it('支持键盘翻转并使用数字键评分', async () => {
    const word = makeWord({ id: 'keyboard-word' });
    const updated = {
      ...word,
      sm2: { ...word.sm2, last_score: 5 },
    };
    const log: ReviewLog = {
      session_id: 'session-review',
      word_id: word.id,
      score: 5,
      reviewed_at: new Date().toISOString(),
    };
    api.getReviewQueue.mockResolvedValue([word]);
    api.submitReview.mockResolvedValue({ word: updated, log });
    api.incrementSession.mockResolvedValue({
      [updated.sm2.next_review_at.slice(0, 10)]: { added: 0, sessions: 1 },
    });

    render(<App />);

    await screen.findByText(word.word);
    fireEvent.keyDown(window, { key: ' ' });
    expect(await screen.findByText(word.definition_ja)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '5' });

    await waitFor(() =>
      expect(api.submitReview).toHaveBeenCalledWith({
        wordId: word.id,
        score: 5,
        sessionId: 'session-review',
      }),
    );
    await waitFor(() => expect(api.incrementSession).toHaveBeenCalledTimes(1));
  });

  it('空队列不触发 session 计数', async () => {
    api.getReviewQueue.mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByText('当前没有待复习的词条')).toBeInTheDocument();
    expect(api.incrementSession).not.toHaveBeenCalled();
  });
});
