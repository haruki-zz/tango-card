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
  CreateWordInput,
  WordCard
} from '../shared/apiTypes';
import { AiClient } from './ai/aiClient';
import { initializeDatabase, type DatabaseContext } from './db/database';
import { createWord } from './db/wordService';
import { buildReviewQueue } from './db/reviewQueueService';

type IpcMainLike = Pick<typeof ipcMain, 'handle'>;

let currentSettings: AppSettings = {
  apiKey: null,
  preferredModel: 'gemini-flash-2.5-lite',
  reviewBatchSize: 1,
  theme: 'light'
};

interface IpcHandlerDeps {
  aiClient?: AiClient;
  database?: DatabaseContext;
}

export function registerIpcHandlers(
  bus: IpcMainLike = ipcMain,
  deps: IpcHandlerDeps = {}
) {
  const aiClient =
    deps.aiClient ??
    new AiClient({
      apiKey: currentSettings.apiKey,
      model: currentSettings.preferredModel
    });
  const database = deps.database ?? initializeDatabase();

  bus.handle(
    IPC_CHANNELS.aiGenerateWordData,
    async (_event, term: string): Promise<GenerateWordDataResult> =>
      aiClient.generateWordData(term)
  );

  bus.handle(
    IPC_CHANNELS.dbGetTodayQueue,
    async (): Promise<WordCard[]> => buildReviewQueue(database.db)
  );

  bus.handle(
    IPC_CHANNELS.dbAnswerReview,
    async (_event, input: AnswerReviewInput): Promise<AnswerReviewResult> => ({
      wordId: input.wordId,
      result: input.result,
      level: input.result === 'again' ? 0 : 1,
      nextDue: input.reviewedAt + 3600
    })
  );

  bus.handle(
    IPC_CHANNELS.dbCreateWord,
    async (_event, input: CreateWordInput): Promise<WordCard> =>
      createWord(database.db, input)
  );

  bus.handle(IPC_CHANNELS.settingsGet, async (): Promise<AppSettings> => currentSettings);

  bus.handle(
    IPC_CHANNELS.settingsUpdate,
    async (_event, patch: Partial<AppSettings>): Promise<AppSettings> => {
      currentSettings = { ...currentSettings, ...patch };
      aiClient.updateConfig({
        apiKey: currentSettings.apiKey,
        model: currentSettings.preferredModel
      });
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
