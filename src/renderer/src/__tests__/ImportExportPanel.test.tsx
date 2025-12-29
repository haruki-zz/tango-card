import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ImportDataPayload,
  ImportDataResponse,
  RendererApi,
} from '@shared/ipc';

import App from '../App';
import { useAppStore } from '../store/useAppStore';

type ApiMock = RendererApi & {
  listWords: ReturnType<typeof vi.fn>;
  getActivity: ReturnType<typeof vi.fn>;
  getReviewQueue: ReturnType<typeof vi.fn>;
  importData: ReturnType<typeof vi.fn<[ImportDataPayload], Promise<ImportDataResponse>>>;
  exportData: ReturnType<typeof vi.fn>;
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
    setProvider: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
  }) as ApiMock;

const setRendererApi = (api: RendererApi) => {
  (window as unknown as { api: RendererApi }).api = api;
};

describe('导入/导出面板', () => {
  let api: ApiMock;

  beforeEach(() => {
    api = createApiMock();
    setRendererApi(api);
    api.listWords.mockResolvedValue([]);
    api.getActivity.mockResolvedValue({});
    api.getReviewQueue.mockResolvedValue([]);
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

  it('成功导入 JSON 并提示跳过与覆盖策略', async () => {
    const content = '[{"word":"勉強"}]';
    api.importData.mockResolvedValue({ imported: 2, skipped: 1 });

    render(<App />);

    const input = await screen.findByLabelText('选择导入文件');
    const file = new File([content], 'words.json', {
      type: 'application/json',
    });
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByText(/导入完成：新增 2 条，跳过 1 条/);
    expect(screen.getByText(/重复词条将按最新内容覆盖/)).toBeInTheDocument();
    await waitFor(() =>
      expect(api.importData).toHaveBeenCalledWith({
        content,
        format: 'json',
      }),
    );
  });

  it('阻止不支持的文件类型并提示错误', async () => {
    render(<App />);

    const input = await screen.findByLabelText('选择导入文件');
    const file = new File(['invalid'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText('仅支持 .json 或 .jsonl 文件导入'),
    ).toBeInTheDocument();
    expect(api.importData).not.toHaveBeenCalled();
  });

  it('导入失败时展示后端错误信息', async () => {
    api.importData.mockRejectedValue(new Error('解析失败'));

    render(<App />);

    const input = await screen.findByLabelText('选择导入文件');
    const file = new File(['broken'], 'broken.jsonl', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('导入失败：解析失败')).toBeInTheDocument();
  });

  it('导出后展示保存路径', async () => {
    api.exportData.mockResolvedValue({
      jsonPath: '/tmp/exports/words.json',
      csvPath: '/tmp/exports/words.csv',
      count: 3,
    });

    render(<App />);

    fireEvent.click(await screen.findByText('导出数据'));

    expect(await screen.findByText(/已导出 3 条词条/)).toBeInTheDocument();
    expect(api.exportData).toHaveBeenCalledTimes(1);
  });
});
