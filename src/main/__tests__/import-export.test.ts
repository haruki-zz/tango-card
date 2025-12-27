import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { FileStorage } from '@main/storage';

const { mkdtemp, readFile, rm } = fs.promises;

const tempDirs: string[] = [];

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'import-export-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  const dirs = tempDirs.splice(0);
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('导入/导出', () => {
  it('JSONL 导入时跳过无效记录并按 word 覆盖', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-08-01T00:00:00Z');

    await storage.addWord(
      {
        id: 'orig',
        word: '初期',
        hiragana: 'しょき',
        definition_ja: '初始',
        example_ja: '初期値。',
      },
      now
    );

    const content = [
      JSON.stringify({
        id: 'overwrite',
        word: '初期',
        hiragana: 'しょき2',
        definition_ja: '上書き',
        example_ja: '上書き例。',
        created_at: '2025-07-20T00:00:00Z',
        sm2: {
          repetition: 3,
          interval: 5,
          ef: 2.8,
          next_review_at: '2025-07-30T00:00:00Z',
          last_score: 4,
        },
      }),
      'not-json',
      JSON.stringify({
        id: 'new-word',
        word: '新規',
        hiragana: 'しんき',
        definition_ja: '新しい',
        example_ja: '新規追加。',
      }),
      JSON.stringify({
        id: 'invalid',
        word: '',
        hiragana: 'あ',
        definition_ja: '无效',
        example_ja: 'should fail',
      }),
    ].join('\n');

    const result = await storage.importWords(content, 'jsonl', now);
    expect(result).toEqual({ imported: 2, skipped: 2 });

    const words = await storage.loadWords(now);
    expect(words).toHaveLength(2);

    const overwritten = words.find((item) => item.word === '初期');
    expect(overwritten?.id).toBe('overwrite');
    expect(overwritten?.created_at).toBe('2025-07-20T00:00:00Z');
    expect(overwritten?.sm2.repetition).toBe(3);

    const added = words.find((item) => item.word === '新規');
    expect(added?.hiragana).toBe('しんき');
  });

  it('非法 JSON 导入不应污染现有文件', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-09-01T00:00:00Z');

    await storage.addWord(
      {
        id: 'keep',
        word: '保持',
        hiragana: 'ほじ',
        definition_ja: '保持',
        example_ja: '保持する。',
      },
      now
    );

    const before = await readFile(path.join(baseDir, 'words.jsonl'), 'utf8');

    await expect(storage.importWords('{"broken": true', 'json', now)).rejects.toThrow(
      /JSON 导入解析失败/
    );

    const after = await readFile(path.join(baseDir, 'words.jsonl'), 'utf8');
    expect(after).toBe(before);
  });

  it('导出会生成 JSON 与 CSV 文件，包含全部词条', async () => {
    const baseDir = await createTempDir();
    const storage = new FileStorage(baseDir);
    const now = new Date('2025-10-01T12:00:00Z');

    await storage.addWord(
      {
        id: 'w1',
        word: '例',
        hiragana: 'れい',
        definition_ja: 'サンプル',
        example_ja: '例として。',
      },
      now
    );
    await storage.addWord(
      {
        id: 'w2',
        word: '確認',
        hiragana: 'かくにん',
        definition_ja: 'チェック',
        example_ja: '確認する。',
      },
      now
    );

    const exportResult = await storage.exportWords(now);
    expect(exportResult.count).toBe(2);

    const jsonContent = await readFile(exportResult.jsonPath, 'utf8');
    const jsonData = JSON.parse(jsonContent);
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData).toHaveLength(2);

    const csvContent = await readFile(exportResult.csvPath, 'utf8');
    const [header, ...rows] = csvContent.trim().split('\n');
    expect(header).toBe(
      'id,word,hiragana,definition_ja,example_ja,created_at,sm2.repetition,sm2.interval,sm2.ef,sm2.next_review_at,sm2.last_score'
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('例');
    expect(rows[1]).toContain('確認');

    expect(fs.existsSync(exportResult.jsonPath)).toBe(true);
    expect(fs.existsSync(exportResult.csvPath)).toBe(true);
  });
});
