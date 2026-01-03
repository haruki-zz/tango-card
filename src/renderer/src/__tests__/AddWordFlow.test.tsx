import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RendererApi } from '@shared/ipc';
import type { WordEntry } from '@shared/types';

import App from '../App';
import { useAppStore } from '../store/useAppStore';

type ApiMock = RendererApi & {
  listWords: ReturnType<typeof vi.fn>;
  getActivity: ReturnType<typeof vi.fn>;
  generateWordContent: ReturnType<typeof vi.fn>;
  addWord: ReturnType<typeof vi.fn>;
  getProvider: ReturnType<typeof vi.fn>;
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
  word: '勉強',
  hiragana: 'べんきょう',
  definition_ja: '学ぶこと。',
  example_ja: '図書館で勉強した。',
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

describe('新增词条流程', () => {
  let api: ApiMock;

  beforeEach(() => {
    api = createApiMock();
    setRendererApi(api);
    api.listWords.mockResolvedValue([]);
    api.getActivity.mockResolvedValue({});
    api.getReviewQueue.mockResolvedValue([]);
    api.getProvider.mockResolvedValue({ provider: 'mock', hasKey: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAppStore.setState({
      words: [],
      reviewQueue: [],
      activity: {},
      provider: null,
      sessionId: null,
    });
  });

  it('阻止空单词触发生成并给出提示', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('生成'));

    expect(
      await screen.findByText('请输入需要生成的单词'),
    ).toBeInTheDocument();
    expect(api.generateWordContent).not.toHaveBeenCalled();
  });

  it('生成内容后填充表单字段', async () => {
    api.generateWordContent.mockResolvedValue({
      hiragana: 'べんきょう',
      definition_ja: '学ぶこと。',
      example_ja: '図書館で勉強した。',
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText('单词'), {
      target: { value: '勉強' },
    });
    fireEvent.click(screen.getByText('生成'));

    await waitFor(() => {
      expect(screen.getByLabelText('读音')).toHaveValue('べんきょう');
    });
    expect(screen.getByLabelText('释义')).toHaveValue('学ぶこと。');
    expect(screen.getByLabelText('例句')).toHaveValue('図書館で勉強した。');
  });

  it('保存后刷新词库与活跃度摘要', async () => {
    const savedWord = makeWord();
    const todayKey = savedWord.created_at.slice(0, 10);
    api.listWords
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([savedWord]);
    api.getActivity
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ [todayKey]: { added: 1, sessions: 0 } });
    api.addWord.mockResolvedValue(savedWord);

    render(<App />);

    fireEvent.change(screen.getByLabelText('单词'), {
      target: { value: savedWord.word },
    });
    fireEvent.change(screen.getByLabelText('读音'), {
      target: { value: savedWord.hiragana },
    });
    fireEvent.change(screen.getByLabelText('释义'), {
      target: { value: savedWord.definition_ja },
    });
    fireEvent.change(screen.getByLabelText('例句'), {
      target: { value: savedWord.example_ja },
    });

    fireEvent.click(screen.getByText('保存到词库'));

    await waitFor(() => expect(api.addWord).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(savedWord.word)).toBeInTheDocument(),
    );
    expect(api.listWords).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.getByText(/新增 1/)).toBeInTheDocument(),
    );
  });
});
