import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

import {
  ActivityByDay,
  ActivityDaySummary,
  ReviewLog,
  WordEntry,
} from '@shared/types';
import {
  normalizeReviewLog,
  normalizeWordRecord,
  validateActivityByDay,
} from '@shared/validation';

const fsPromises = fs.promises;

export type WordInput = Omit<WordEntry, 'created_at' | 'sm2'> &
  Partial<Pick<WordEntry, 'created_at' | 'sm2'>> & {
    source?: unknown;
  };

export type ReviewLogInput = Omit<ReviewLog, 'reviewed_at'> &
  Partial<Pick<ReviewLog, 'reviewed_at'>>;

const ensureDir = async (dir: string) => fsPromises.mkdir(dir, { recursive: true });

const readOptionalFile = async (filePath: string) => {
  try {
    return await fsPromises.readFile(filePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

const buildTempPath = (filePath: string) => {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return path.join(dir, `${name}.${unique}.tmp`);
};

const safeWriteFile = async (filePath: string, data: string) => {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tempPath = buildTempPath(filePath);
  try {
    await fsPromises.writeFile(tempPath, data, 'utf8');
    await fsPromises.rename(tempPath, filePath);
  } catch (error) {
    await fsPromises.unlink(tempPath).catch(() => {});
    throw error;
  }
};

const parseJsonLines = <T>(content: string, normalizer: (value: unknown) => T): T[] => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    try {
      return normalizer(JSON.parse(line));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`解析 JSONL 第 ${index + 1} 行失败: ${message}`);
    }
  });
};

const appendJsonLine = (content: string, record: unknown) => {
  const trimmed = content.trimEnd();
  const serialized = JSON.stringify(record);
  if (trimmed === '') {
    return `${serialized}\n`;
  }
  return `${trimmed}\n${serialized}\n`;
};

const toDayKey = (isoDate: string) => isoDate.slice(0, 10);

export class FileStorage {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? app.getPath('userData');
  }

  private get wordsPath() {
    return path.join(this.baseDir, 'words.jsonl');
  }

  private get reviewsPath() {
    return path.join(this.baseDir, 'reviews.jsonl');
  }

  private get activityPath() {
    return path.join(this.baseDir, 'activity.json');
  }

  async loadWords(now = new Date()): Promise<WordEntry[]> {
    const content = await readOptionalFile(this.wordsPath);
    if (content.trim() === '') {
      return [];
    }
    return parseJsonLines(content, (raw) => normalizeWordRecord(raw, now));
  }

  async addWord(raw: WordInput, now = new Date()): Promise<WordEntry> {
    const normalized = normalizeWordRecord(this.stripSource(raw), now);
    const existing = await readOptionalFile(this.wordsPath);
    const nextContent = appendJsonLine(existing, normalized);
    await safeWriteFile(this.wordsPath, nextContent);
    await this.updateActivity(toDayKey(normalized.created_at), { added: 1 });
    return normalized;
  }

  async loadReviewLogs(now = new Date()): Promise<ReviewLog[]> {
    const content = await readOptionalFile(this.reviewsPath);
    if (content.trim() === '') {
      return [];
    }
    return parseJsonLines(content, (raw) => normalizeReviewLog(raw, now));
  }

  async appendReviewLog(raw: ReviewLogInput, now = new Date()): Promise<ReviewLog> {
    const normalized = normalizeReviewLog(raw, now);
    const existing = await readOptionalFile(this.reviewsPath);
    const nextContent = appendJsonLine(existing, normalized);
    await safeWriteFile(this.reviewsPath, nextContent);
    return normalized;
  }

  async saveWords(words: WordEntry[], now = new Date()): Promise<WordEntry[]> {
    if (words.length === 0) {
      await safeWriteFile(this.wordsPath, '');
      return [];
    }

    const normalized = words.map((word) => normalizeWordRecord(word, now));
    const content = normalized.map((word) => JSON.stringify(word)).join('\n');
    await safeWriteFile(this.wordsPath, `${content}\n`);
    return normalized;
  }

  async loadActivity(): Promise<ActivityByDay> {
    const content = await readOptionalFile(this.activityPath);
    if (content.trim() === '') {
      return {};
    }
    return validateActivityByDay(JSON.parse(content));
  }

  async incrementSession(date: string | Date = new Date()): Promise<ActivityByDay> {
    const iso = date instanceof Date ? date.toISOString() : date;
    const day = toDayKey(iso);
    return this.updateActivity(day, { sessions: 1 });
  }

  private async updateActivity(
    day: string,
    delta: Partial<ActivityDaySummary>
  ): Promise<ActivityByDay> {
    const activity = await this.loadActivity();
    const current = activity[day] ?? { added: 0, sessions: 0 };
    const added = delta.added ?? 0;
    const sessions = delta.sessions ?? 0;
    activity[day] = {
      added: Math.max(0, current.added + added),
      sessions: Math.max(0, current.sessions + sessions),
    };
    await safeWriteFile(this.activityPath, `${JSON.stringify(activity, null, 2)}\n`);
    return activity;
  }

  private stripSource(input: WordInput) {
    const { source: _source, ...rest } = input;
    return rest;
  }
}
