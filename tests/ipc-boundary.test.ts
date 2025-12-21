import { describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from '../src/main/ipcHandlers';
import { initializeDatabase } from '../src/main/db/database';
import { createPreloadApi } from '../src/preload/createApi';
import { AiClient } from '../src/main/ai/aiClient';

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

    const aiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              pronunciation: 'すし',
              definition_cn: '以醋饭和鱼类为主的日式料理，常见于日本餐桌。',
              examples: [
                {
                  sentence_jp: '週末に友だちと寿司を食べました。',
                  sentence_cn: '周末和朋友一起吃了寿司。'
                }
              ]
            })
          }
        }
      ]
    };

    const aiClient = new AiClient({
      apiKey: 'test-key',
      model: 'gpt-4o',
      fetchImpl: vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => aiResponse,
        text: async () => JSON.stringify(aiResponse)
      }))
    });

    const database = initializeDatabase(':memory:');
    registerIpcHandlers(mockBus, { aiClient, database });

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

    await api.db.createWord({
      term: '寿司',
      pronunciation: 'すし',
      definition_cn: '以醋饭和鱼类为主的日式料理。',
      examples: [
        {
          sentence_jp: '週末に友だちと寿司を食べました。',
          sentence_cn: '周末和朋友一起吃了寿司。'
        }
      ],
      tags: []
    });

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
