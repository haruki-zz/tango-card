import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileStorage } from '@main/storage';

const { mkdtemp, readFile, rm } = fs.promises;

const tempDirs: string[] = [];

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'storage-test-'));
  tempDirs.push(dir);
  return dir;
};

const readJson = async <T>(filePath: string): Promise<T> => {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
};

afterEach(async () => {
  const dirs = tempDirs.splice(0);
  await Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
  vi.restoreAllMocks();
});

describe('FileStorage', () => {
  it('新增词条时补全默认字段并写入 JSONL，活跃度累计新增次数', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-01-20T09:00:00Z');

    const word = await storage.addWord(
      {
        id: 'w1',
        word: '勉強',
        hiragana: 'べんきょう',
        definition_ja: '学ぶこと',
        example_ja: '図書館で勉強する。',
      },
      now,
    );

    expect(word.created_at).toBe('2025-01-20T09:00:00.000Z');
    expect(word.sm2).toMatchObject({
      repetition: 0,
      interval: 1,
      ef: 2.5,
      last_score: null,
    });

    const words = await storage.loadWords(now);
    expect(words).toEqual([word]);

    const wordsFile = await readFile(path.join(baseDir, 'words.jsonl'), 'utf8');
    expect(wordsFile.trim().split('\n')).toHaveLength(1);

    const activity = await readJson<
      Record<string, { added: number; sessions: number }>
    >(path.join(baseDir, 'activity.json'));
    expect(activity['2025-01-20']).toEqual({ added: 1, sessions: 0 });
  });

  it('记录复习日志时补全 reviewed_at 字段', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-02-01T08:00:00Z');

    const log = await storage.appendReviewLog(
      {
        session_id: 's1',
        word_id: 'w1',
        score: 4,
      },
      now,
    );

    expect(log.reviewed_at).toBe('2025-02-01T08:00:00.000Z');

    const logs = await storage.loadReviewLogs(now);
    expect(logs).toEqual([log]);

    const reviewsFile = await readFile(
      path.join(baseDir, 'reviews.jsonl'),
      'utf8',
    );
    expect(reviewsFile.trim().split('\n')).toHaveLength(1);
  });

  it('活跃度可以累计 session 次数且不影响新增计数', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);

    await storage.incrementSession('2025-03-05T12:00:00Z');
    await storage.incrementSession(new Date('2025-03-05T23:59:59Z'));

    const activity = await storage.loadActivity();
    expect(activity['2025-03-05']).toEqual({ added: 0, sessions: 2 });
  });

  it('写入失败时保留原有文件内容', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-04-01T00:00:00Z');

    await storage.addWord(
      {
        id: 'w-initial',
        word: '初期',
        hiragana: 'しょき',
        definition_ja: '初始状态',
        example_ja: '初期化を行う。',
      },
      now,
    );

    const before = await readFile(path.join(baseDir, 'words.jsonl'), 'utf8');
    vi.spyOn(fs.promises, 'rename').mockRejectedValueOnce(
      new Error('rename failed'),
    );

    await expect(
      storage.addWord(
        {
          id: 'w-fail',
          word: '失敗',
          hiragana: 'しっぱい',
          definition_ja: 'エラー',
          example_ja: '書き込みが失敗した。',
        },
        now,
      ),
    ).rejects.toThrow(/rename failed/);

    const after = await readFile(path.join(baseDir, 'words.jsonl'), 'utf8');
    expect(after).toBe(before);
  });
});
