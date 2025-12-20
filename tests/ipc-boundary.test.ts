import { describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from '../src/main/ipcHandlers';
import { createPreloadApi } from '../src/preload/createApi';

vi.mock('electron', () => {
  return {
    ipcMain: {
      handle: vi.fn()
    }
  };
});

describe('ipc boundary', () => {
  it('exposes whitelisted apis with predictable mock responses', async () => {
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const mockBus: Parameters<typeof registerIpcHandlers>[0] = {
      handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers[channel] = handler;
      }
    };

    registerIpcHandlers(mockBus);

    const invoke = (channel: string, ...args: unknown[]) =>
      Promise.resolve(handlers[channel]?.({} as unknown, ...args));
    const api = createPreloadApi(invoke);

    expect(api.ping()).toBe('pong');

    const aiResult = await api.ai.generateWordData('寿司');
    expect(aiResult.ok).toBe(true);
    if (aiResult.ok) {
      expect(aiResult.data.term).toBe('寿司');
      expect(aiResult.data.examples[0].sentence_cn).toContain('寿司');
    }

    const queue = await api.db.getTodayQueue();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].term).toBe('寿司');

    const review = await api.db.answerReview({
      wordId: queue[0].id,
      result: 'good',
      reviewedAt: 1_000
    });
    expect(review.nextDue).toBeGreaterThan(1_000);
    expect(review.level).toBeGreaterThanOrEqual(1);

    const settings = await api.settings.getSettings();
    expect(settings.preferredModel).toContain('gemini');

    const updated = await api.settings.updateSettings({
      theme: 'dark',
      reviewBatchSize: 2
    });
    expect(updated.theme).toBe('dark');
    expect(updated.reviewBatchSize).toBe(2);

    const importResult = await api.files.importWords('/tmp/sample.json');
    expect(importResult.imported).toBeGreaterThan(0);

    const exportResult = await api.files.exportBackup();
    expect(exportResult.filePath).toContain('tango-card-backup');
    expect(exportResult.count).toBeGreaterThan(0);
  });
});
