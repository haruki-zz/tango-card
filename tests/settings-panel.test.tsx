import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExposedApi } from '../src/shared/apiTypes';
import { SettingsPanel } from '../src/renderer/features/settings/SettingsPanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SettingsPanel', () => {
  it('loads existing settings and populates fields', async () => {
    const getSettings = vi.fn().mockResolvedValue({
      apiKey: 'pk-live',
      preferredModel: 'gpt-4o',
      reviewBatchSize: 2,
      theme: 'dark'
    });

    stubApi({ getSettings });

    render(<SettingsPanel />);

    const modelSelect = await screen.findByLabelText('AI 模型');
    await waitFor(() => expect(modelSelect).toHaveValue('gpt-4o'));
    expect(screen.getByLabelText('每次复习批次大小')).toHaveValue(2);
    expect(screen.getByRole('button', { name: '深色' })).toHaveClass('is-active');
  });

  it('saves updates with normalized payloads', async () => {
    const user = userEvent.setup();
    const getSettings = vi.fn().mockResolvedValue({
      apiKey: null,
      preferredModel: 'gemini-flash-2.5-lite',
      reviewBatchSize: 1,
      theme: 'light'
    });
    const updateSettings = vi.fn().mockResolvedValue({
      apiKey: 'pk-123',
      preferredModel: 'gpt-4.1-mini',
      reviewBatchSize: 5,
      theme: 'system'
    });

    stubApi({ getSettings, updateSettings });

    render(<SettingsPanel />);
    await screen.findByText('设置');

    await user.type(screen.getByLabelText('API Key'), '  pk-123  ');
    await user.selectOptions(screen.getByLabelText('AI 模型'), 'gpt-4.1-mini');
    await user.clear(screen.getByLabelText('每次复习批次大小'));
    await user.type(screen.getByLabelText('每次复习批次大小'), '5');
    await user.click(screen.getByRole('button', { name: '跟随系统' }));

    await user.click(screen.getByRole('button', { name: '保存设置' }));

    expect(updateSettings).toHaveBeenCalledWith({
      apiKey: 'pk-123',
      preferredModel: 'gpt-4.1-mini',
      reviewBatchSize: 5,
      theme: 'system'
    });
    await screen.findByText(/已保存到本地数据库/);
  });
});

function stubApi(options: {
  getSettings: () => Promise<unknown>;
  updateSettings?: (payload: unknown) => Promise<unknown>;
}) {
  const api: ExposedApi = {
    ping: () => 'pong',
    ai: {
      generateWordData: vi.fn()
    },
    db: {
      getTodayQueue: vi.fn(),
      answerReview: vi.fn(),
      createWord: vi.fn(),
      getHeatmapActivity: vi.fn()
    },
    settings: {
      getSettings: options.getSettings as ExposedApi['settings']['getSettings'],
      updateSettings:
        (options.updateSettings as ExposedApi['settings']['updateSettings']) ??
        (async () => ({
          apiKey: null,
          preferredModel: 'gemini-flash-2.5-lite',
          reviewBatchSize: 1,
          theme: 'light'
        }))
    },
    files: {
      importWords: vi.fn(),
      exportBackup: vi.fn()
    }
  };

  (window as unknown as { api: ExposedApi }).api = api;
}
