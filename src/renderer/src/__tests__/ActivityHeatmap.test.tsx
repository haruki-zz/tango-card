import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RendererApi } from '@shared/ipc';

import App from '../App';
import { useAppStore } from '../store/useAppStore';

type ApiMock = RendererApi & {
  listWords: ReturnType<typeof vi.fn>;
  getActivity: ReturnType<typeof vi.fn>;
  getReviewQueue: ReturnType<typeof vi.fn>;
  generateWordContent: ReturnType<typeof vi.fn>;
  addWord: ReturnType<typeof vi.fn>;
  submitReview: ReturnType<typeof vi.fn>;
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

const dayKey = (offset = 0) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
};

describe('活跃度方格', () => {
  let api: ApiMock;

  beforeEach(() => {
    api = createApiMock();
    setRendererApi(api);
    api.listWords.mockResolvedValue([]);
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

  it('根据活跃度渲染颜色强度', async () => {
    const today = dayKey();
    const yesterday = dayKey(1);
    const earlier = dayKey(5);

    api.getActivity.mockResolvedValue({
      [today]: { added: 3, sessions: 2 },
      [yesterday]: { added: 1, sessions: 0 },
    });

    render(<App />);

    const todayCell = await screen.findByTestId(`activity-${today}`);
    const yesterdayCell = screen.getByTestId(`activity-${yesterday}`);
    const earlierCell = screen.getByTestId(`activity-${earlier}`);

    expect(todayCell.getAttribute('data-level')).toBe('2');
    expect(yesterdayCell.getAttribute('data-level')).toBe('1');
    expect(earlierCell.getAttribute('data-level')).toBe('0');
    expect(screen.getByText('今日合计')).toBeInTheDocument();
  });

  it('悬停提示包含新增与复习详情', async () => {
    const today = dayKey();

    api.getActivity.mockResolvedValue({
      [today]: { added: 2, sessions: 1 },
    });

    render(<App />);

    const todayCell = await screen.findByTestId(`activity-${today}`);

    expect(todayCell).toHaveAttribute('title', `${today}｜新增 2｜復習 1 sessions`);
    expect(todayCell).toHaveAttribute('aria-label', `${today} 新增 2 条 · 復習 1 次`);
  });
});
