import { describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '../../../electron/ipc-channels';
import { createPreloadApi, freezePreloadApi } from '../../../electron/preload-api';

const buildApi = () => {
  const invoke = vi.fn<(...args: unknown[]) => Promise<unknown>>();
  const api = freezePreloadApi(createPreloadApi({ invoke }));

  return { api, invoke };
};

describe('preload API bridge', () => {
  it('暴露受控的 API 分组', () => {
    const { api } = buildApi();

    expect(api.word).toBeDefined();
    expect(api.review).toBeDefined();
    expect(api.activity).toBeDefined();
    expect(api.ai).toBeDefined();
  });

  it('通过白名单频道调用 ipcRenderer.invoke', async () => {
    const { api, invoke } = buildApi();
    const sampleWord = { term: '水', note: 'water' };
    const session = {
      word_ids: ['1'],
      results: [{ word_id: '1', status: 'familiar' }],
      started_at: '2024-01-01T00:00:00Z'
    };
    const range = { from: '2024-01-01', to: '2024-01-31' };
    const aiInput = { term: '猫' };

    invoke.mockResolvedValueOnce(undefined);
    await api.word.add(sampleWord);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.word.add, sampleWord);

    invoke.mockResolvedValueOnce([]);
    await api.word.listRandom({ limit: 5 });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.word.listRandom, { limit: 5 });

    invoke.mockResolvedValueOnce(undefined);
    await api.review.create(session);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.review.create, session);

    invoke.mockResolvedValueOnce([]);
    await api.activity.stats(range);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.activity.stats, range);

    invoke.mockResolvedValueOnce({});
    await api.ai.generateForWord(aiInput);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.ai.generateForWord, aiInput);
  });

  it('冻结暴露的 API，避免渲染层篡改', () => {
    const { api } = buildApi();

    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.isFrozen(api.word)).toBe(true);
    expect(Object.isFrozen(api.review)).toBe(true);
    expect(Object.isFrozen(api.activity)).toBe(true);
    expect(Object.isFrozen(api.ai)).toBe(true);

    expect(() => {
      // @ts-expect-error runtime 保护验证
      api.word = {} as never;
    }).toThrow(TypeError);

    expect(() => {
      // @ts-expect-error runtime 保护验证
      api.ai.generateForWord = async () => ({});
    }).toThrow(TypeError);
  });
});
