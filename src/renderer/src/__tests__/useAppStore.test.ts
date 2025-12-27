import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type AddWordPayload,
  type ExportDataResponse,
  type GeneratedWordContent,
  type GenerateWordPayload,
  type ImportDataPayload,
  type ImportDataResponse,
  type ProviderSettings,
  type RendererApi,
  type ReviewSubmitPayload,
  type SafeProviderSettings,
} from '@shared/ipc';
import type { ActivityByDay, ReviewLog, WordEntry } from '@shared/types';

import { createAppStore } from '../store/useAppStore';

type MockedRendererApi = ReturnType<typeof createApiMock>;

type StoreWithApi = {
  store: ReturnType<typeof createAppStore>;
  api: MockedRendererApi;
};

const makeWord = (overrides: Partial<WordEntry> = {}): WordEntry => ({
  id: 'word-1',
  word: '勉強',
  hiragana: 'べんきょう',
  definition_ja: '学ぶこと。',
  example_ja: '図書館で勉強した。',
  created_at: '2025-01-01T00:00:00Z',
  sm2: {
    repetition: 0,
    interval: 1,
    ef: 2.5,
    next_review_at: '2025-01-02T00:00:00Z',
    last_score: null,
  },
  ...overrides,
});

const createApiMock = () =>
  ({
    listWords: vi.fn<[], Promise<WordEntry[]>>(),
    addWord: vi.fn<[AddWordPayload], Promise<WordEntry>>(),
    generateWordContent: vi.fn<[GenerateWordPayload], Promise<GeneratedWordContent>>(),
    getReviewQueue: vi.fn<[], Promise<WordEntry[]>>(),
    submitReview: vi.fn<[ReviewSubmitPayload], Promise<{ word: WordEntry; log: ReviewLog }>>(),
    getActivity: vi.fn<[], Promise<ActivityByDay>>(),
    incrementSession: vi.fn<[string?], Promise<ActivityByDay>>(),
    setProvider: vi.fn<[ProviderSettings], Promise<SafeProviderSettings>>(),
    exportData: vi.fn<[], Promise<ExportDataResponse>>(),
    importData: vi.fn<[ImportDataPayload], Promise<ImportDataResponse>>(),
  }) satisfies RendererApi;

const createStore = (
  api: MockedRendererApi = createApiMock(),
  sessionId = 'session-mock'
): StoreWithApi => ({
  api,
  store: createAppStore({
    getApi: () => api,
    createSessionId: () => sessionId,
  }),
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAppStore', () => {
  it('loads words from IPC and replaces state', async () => {
    const { store, api } = createStore();
    const words = [makeWord(), makeWord({ id: 'word-2', word: '走る' })];
    api.listWords.mockResolvedValue(words);

    const result = await store.getState().loadWords();

    expect(result).toEqual(words);
    expect(store.getState().words).toEqual(words);
    expect(api.listWords).toHaveBeenCalledTimes(1);
  });

  it('creates a session when queue is loaded and none exists', async () => {
    const { store, api } = createStore(undefined, 'session-from-factory');
    const queue = [makeWord({ id: 'queue-1' })];
    api.getReviewQueue.mockResolvedValue(queue);

    await store.getState().loadReviewQueue();

    expect(store.getState().reviewQueue).toEqual(queue);
    expect(store.getState().sessionId).toBe('session-from-factory');
  });

  it('keeps existing session when queue returns empty', async () => {
    const { store, api } = createStore();
    store.setState({ sessionId: 'existing-session' });
    api.getReviewQueue.mockResolvedValue([]);

    await store.getState().loadReviewQueue();

    expect(store.getState().reviewQueue).toEqual([]);
    expect(store.getState().sessionId).toBe('existing-session');
  });

  it('submits review, updates words, and removes from queue', async () => {
    const { store, api } = createStore();
    const queuedWord = makeWord({ id: 'queue-1' });
    const updated = makeWord({
      id: 'queue-1',
      sm2: { ...queuedWord.sm2, repetition: 1, interval: 6 },
    });
    const log: ReviewLog = {
      session_id: 'active-session',
      word_id: 'queue-1',
      score: 4,
      reviewed_at: '2025-01-02T00:00:00Z',
    };
    store.setState({
      words: [queuedWord],
      reviewQueue: [queuedWord],
      sessionId: 'active-session',
    });
    api.submitReview.mockResolvedValue({ word: updated, log });

    const result = await store.getState().submitReview(queuedWord.id, 4);

    expect(api.submitReview).toHaveBeenCalledWith({
      wordId: 'queue-1',
      score: 4,
      sessionId: 'active-session',
    });
    expect(result.word).toEqual(updated);
    expect(result.log).toEqual(log);
    expect(store.getState().words).toEqual([updated]);
    expect(store.getState().reviewQueue).toEqual([]);
    expect(store.getState().sessionId).toBe('active-session');
  });

  it('generates a session automatically when submitting without one', async () => {
    const { store, api } = createStore(undefined, 'session-auto');
    const queuedWord = makeWord({ id: 'queue-2' });
    const log: ReviewLog = {
      session_id: 'session-auto',
      word_id: 'queue-2',
      score: 3,
      reviewed_at: '2025-01-03T00:00:00Z',
    };
    api.submitReview.mockResolvedValue({
      word: queuedWord,
      log,
    });
    store.setState({ reviewQueue: [queuedWord] });

    await store.getState().submitReview(queuedWord.id, 3);

    expect(api.submitReview).toHaveBeenCalledWith({
      wordId: 'queue-2',
      score: 3,
      sessionId: 'session-auto',
    });
    expect(store.getState().sessionId).toBe('session-auto');
  });

  it('increments session and clears state when completing', async () => {
    const { store, api } = createStore();
    const summary: ActivityByDay = {
      '2025-01-02': { added: 1, sessions: 2 },
    };
    store.setState({ sessionId: 'active-session', reviewQueue: [makeWord()] });
    api.incrementSession.mockResolvedValue(summary);

    const activity = await store.getState().completeSession();

    expect(activity).toEqual(summary);
    expect(store.getState().activity).toEqual(summary);
    expect(store.getState().reviewQueue).toEqual([]);
    expect(store.getState().sessionId).toBeNull();
    expect(api.incrementSession).toHaveBeenCalledWith(undefined);
  });

  it('throws when completing without an active session', async () => {
    const { store, api } = createStore();

    await expect(store.getState().completeSession()).rejects.toThrow(
      '当前没有进行中的复习 session'
    );
    expect(api.incrementSession).not.toHaveBeenCalled();
  });

  it('refreshes activity from IPC', async () => {
    const { store, api } = createStore();
    const activity: ActivityByDay = {
      '2025-01-04': { added: 2, sessions: 1 },
    };
    api.getActivity.mockResolvedValue(activity);

    await store.getState().refreshActivity();

    expect(store.getState().activity).toEqual(activity);
    expect(api.getActivity).toHaveBeenCalledTimes(1);
  });

  it('imports data then syncs word list', async () => {
    const { store, api } = createStore();
    const importedWords = [makeWord({ id: 'imported' })];
    api.importData.mockResolvedValue({
      imported: 2,
      skipped: 1,
    });
    api.listWords.mockResolvedValue(importedWords);

    const result = await store
      .getState()
      .importData({ content: '{}', format: 'json' });

    expect(result).toEqual({ imported: 2, skipped: 1 });
    expect(store.getState().words).toEqual(importedWords);
    expect(api.importData).toHaveBeenCalledWith({ content: '{}', format: 'json' });
    expect(api.listWords).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite provider when setting fails', async () => {
    const { store, api } = createStore();
    store.setState({ provider: { provider: 'mock' } });
    api.setProvider.mockRejectedValue(new Error('provider failure'));

    await expect(
      store.getState().setProvider({ provider: 'openai', apiKey: 'k' })
    ).rejects.toThrow('provider failure');
    expect(store.getState().provider).toEqual({ provider: 'mock' });
  });
});
