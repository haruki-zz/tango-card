import path from 'node:path';
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/ipcChannels';
import {
  AnswerReviewInput,
  AnswerReviewResult,
  AppSettings,
  ExportResult,
  GenerateWordDataResult,
  ImportResult,
  WordCard
} from '../shared/apiTypes';

type IpcMainLike = Pick<typeof ipcMain, 'handle'>;

const baseTimestamp = Math.floor(Date.now() / 1000);

const mockWordCard: WordCard = {
  id: 1,
  term: '寿司',
  pronunciation: 'すし',
  definition_cn: '以醋饭和鱼类为主的日式料理，常见于日本餐桌。',
  examples: [
    {
      sentence_jp: '週末に友だちと寿司を食べました。',
      sentence_cn: '周末和朋友一起吃了寿司。'
    }
  ],
  tags: ['food', 'basic'],
  created_at: baseTimestamp - 86400,
  updated_at: baseTimestamp - 3600,
  srs_level: 0,
  srs_repetitions: 0,
  srs_interval: 0,
  ease_factor: 2.5,
  last_reviewed_at: null,
  due_at: baseTimestamp
};

let currentSettings: AppSettings = {
  apiKey: null,
  preferredModel: 'gemini-flash-2.5-lite',
  reviewBatchSize: 1,
  theme: 'light'
};

export function registerIpcHandlers(bus: IpcMainLike = ipcMain) {
  bus.handle(
    IPC_CHANNELS.aiGenerateWordData,
    async (_event, term: string): Promise<GenerateWordDataResult> => ({
      ok: true,
      data: {
        term,
        pronunciation: mockWordCard.pronunciation,
        definition_cn: mockWordCard.definition_cn,
        examples: mockWordCard.examples
      }
    })
  );

  bus.handle(IPC_CHANNELS.dbGetTodayQueue, async (): Promise<WordCard[]> => [
    mockWordCard
  ]);

  bus.handle(
    IPC_CHANNELS.dbAnswerReview,
    async (_event, input: AnswerReviewInput): Promise<AnswerReviewResult> => ({
      wordId: input.wordId,
      result: input.result,
      level: input.result === 'again' ? 0 : mockWordCard.srs_level + 1,
      nextDue: input.reviewedAt + 3600
    })
  );

  bus.handle(IPC_CHANNELS.settingsGet, async (): Promise<AppSettings> => currentSettings);

  bus.handle(
    IPC_CHANNELS.settingsUpdate,
    async (_event, patch: Partial<AppSettings>): Promise<AppSettings> => {
      currentSettings = { ...currentSettings, ...patch };
      return currentSettings;
    }
  );

  bus.handle(
    IPC_CHANNELS.filesImport,
    async (_event, filePath: string): Promise<ImportResult> => ({
      imported: 3,
      skipped: 0,
      message: `已读取 ${path.basename(filePath)}`
    })
  );

  bus.handle(IPC_CHANNELS.filesExport, async (): Promise<ExportResult> => ({
    filePath: path.join(process.cwd(), 'tango-card-backup.json'),
    count: 1,
    exportedAt: Math.floor(Date.now() / 1000)
  }));
}
