import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerIpcHandlers } from '@main/ipc/handlers';
import { FileStorage } from '@main/storage';
import { IPC_CHANNELS } from '@shared/ipc';

const { mkdtemp, readFile, rm } = fs.promises;

const tempDirs: string[] = [];

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ipc-test-'));
  tempDirs.push(dir);
  return dir;
};

const createIpcMock = () => ({
  handle: vi.fn(),
  removeHandler: vi.fn(),
});

const cleanup = async () => {
  const dirs = tempDirs.splice(0);
  await Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
};

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

describe('IPC handlers', () => {
  it('生成词条、写入并拉取词库', async () => {
    const now = new Date('2025-06-01T09:00:00Z');
    const { invoke, dispose } = registerIpcHandlers({
      storage: new FileStorage(await createTempDir()),
      getNow: () => now,
      ipc: createIpcMock(),
    });

    const generated = await invoke(IPC_CHANNELS.GENERATE_WORD, {
      word: '勉強',
      maxOutputChars: 8,
    });
    expect(generated.hiragana).toBe('てすと');
    expect(generated.definition_ja.length).toBeLessThanOrEqual(11);

    const added = await invoke(IPC_CHANNELS.ADD_WORD, {
      id: 'word-1',
      word: '勉強',
      hiragana: generated.hiragana,
      definition_ja: generated.definition_ja,
      example_ja: generated.example_ja,
    });

    expect(added.created_at).toBe(now.toISOString());

    const listed = await invoke(IPC_CHANNELS.LIST_WORDS, undefined);
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe('word-1');

    dispose();
  });

  it('提交评分时更新 SM-2 并记录复习日志', async () => {
    const times = [
      new Date('2025-06-10T00:00:00Z'),
      new Date('2025-06-11T12:00:00Z'),
    ];
    let index = 0;
    const getNow = vi.fn(() => times[Math.min(index++, times.length - 1)]);
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const { invoke, dispose } = registerIpcHandlers({
      storage,
      getNow,
      ipc: createIpcMock(),
    });

    await invoke(IPC_CHANNELS.ADD_WORD, {
      id: 'w1',
      word: '単語',
      hiragana: 'たんご',
      definition_ja: '単語の説明',
      example_ja: '例文。',
    });

    const result = await invoke(IPC_CHANNELS.SUBMIT_REVIEW, {
      wordId: 'w1',
      sessionId: 's-1',
      score: 5,
    });

    expect(result.word.sm2.last_score).toBe(5);
    expect(result.word.sm2.repetition).toBe(1);
    expect(result.log.reviewed_at).toBe(times[1].toISOString());

    const reviews = await readFile(path.join(baseDir, 'reviews.jsonl'), 'utf8');
    expect(reviews.trim().split('\n')).toHaveLength(1);

    dispose();
  });

  it('读取和累计活跃度时验证日期输入', async () => {
    const now = new Date('2025-07-01T00:00:00Z');
    const storage = new FileStorage(await createTempDir());
    const { invoke, dispose } = registerIpcHandlers({
      storage,
      getNow: () => now,
      ipc: createIpcMock(),
    });

    const initial = await invoke(IPC_CHANNELS.ACTIVITY_GET, undefined);
    expect(initial).toEqual({});

    const next = await invoke(IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION, {
      date: '2025-07-01T10:00:00Z',
    });
    expect(next['2025-07-01']).toEqual({ added: 0, sessions: 1 });

    await expect(
      invoke(IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION, { date: 'not-a-date' }),
    ).rejects.toThrow(/日期/);

    dispose();
  });

  it('导入/导出信道可去重并生成文件路径', async () => {
    const now = new Date('2025-10-10T00:00:00Z');
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const { invoke, dispose } = registerIpcHandlers({
      storage,
      getNow: () => now,
      ipc: createIpcMock(),
    });

    await invoke(IPC_CHANNELS.ADD_WORD, {
      id: 'w1',
      word: '単語',
      hiragana: 'たんご',
      definition_ja: '説明',
      example_ja: '例文。',
    });

    const summary = await invoke(IPC_CHANNELS.IMPORT_DATA, {
      content: JSON.stringify([
        {
          id: 'override',
          word: '単語',
          hiragana: 'たんご2',
          definition_ja: '更新',
          example_ja: '上書き。',
        },
        {
          id: 'w2',
          word: '追加',
          hiragana: 'ついか',
          definition_ja: '新規',
          example_ja: '追加した。',
        },
      ]),
      format: 'json',
    });

    expect(summary).toEqual({ imported: 2, skipped: 0 });

    const exported = await invoke(IPC_CHANNELS.EXPORT_DATA, undefined as never);
    expect(exported.count).toBe(2);
    expect(fs.existsSync(exported.jsonPath)).toBe(true);
    expect(fs.existsSync(exported.csvPath)).toBe(true);

    await expect(
      invoke(IPC_CHANNELS.IMPORT_DATA, { content: '', format: 'json' }),
    ).rejects.toThrow(/content/);

    dispose();
  });

  it('设置 provider 时要求密钥，未知信道拒绝调用', async () => {
    const { invoke, dispose } = registerIpcHandlers({
      storage: new FileStorage(await createTempDir()),
      ipc: createIpcMock(),
    });

    await expect(
      invoke(IPC_CHANNELS.SET_PROVIDER, { provider: 'openai' } as never),
    ).rejects.toThrow(/apiKey/);

    await expect(
      invoke(
        'unknown-channel' as (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS],
        undefined,
      ),
    ).rejects.toThrow(/未注册/);

    dispose();
  });
});
