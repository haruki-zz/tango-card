import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RendererApi } from '@shared/ipc';

import SettingsPanel from '../components/SettingsPanel';
import { useAppStore } from '../store/useAppStore';

type ApiMock = RendererApi & {
  setProvider: ReturnType<typeof vi.fn>;
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

describe('LLM 设置面板', () => {
  let api: ApiMock;

  beforeEach(() => {
    api = createApiMock();
    setRendererApi(api);
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

  it('要求非 mock provider 填写密钥', async () => {
    render(<SettingsPanel />);

    fireEvent.change(screen.getByLabelText('LLM 提供商'), {
      target: { value: 'openai' },
    });
    fireEvent.click(screen.getByText('保存设置'));

    expect(
      await screen.findByText('请选择 provider 并填写密钥后再保存'),
    ).toBeInTheDocument();
    expect(api.setProvider).not.toHaveBeenCalled();
  });

  it('保存 provider 后清空输入并提示密钥已保存', async () => {
    api.setProvider.mockResolvedValue({
      provider: 'openai',
      hasKey: true,
    });

    render(<SettingsPanel />);

    fireEvent.change(screen.getByLabelText('LLM 提供商'), {
      target: { value: 'openai' },
    });
    fireEvent.change(screen.getByLabelText('API 密钥'), {
      target: { value: 'sk-test-123 ' },
    });
    fireEvent.click(screen.getByText('保存设置'));

    expect(
      await screen.findByText('设置已保存，密钥仅存于系统安全存储'),
    ).toBeInTheDocument();
    expect(api.setProvider).toHaveBeenCalledWith({
      provider: 'openai',
      apiKey: 'sk-test-123',
    });
    expect(screen.getByLabelText('API 密钥')).toHaveValue('');
    expect(
      screen.getByText('已检测到保存的密钥，已遮蔽展示，重新输入会覆盖。'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('已保存')).not.toHaveLength(0);
  });
});
