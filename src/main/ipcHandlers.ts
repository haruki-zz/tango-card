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
  WordCard,
  HeatmapActivityRange
} from '../shared/apiTypes';
import { AiClient } from './ai/aiClient';
import { initializeDatabase, type DatabaseContext } from './db/database';
import { createWord } from './db/wordService';
import { buildReviewQueue } from './db/reviewQueueService';
import { answerReview } from './db/reviewService';
import { getHeatmapActivity } from './db/activityService';
import { getAppSettings, updateAppSettings } from './db/settingsService';

type IpcMainLike = Pick<typeof ipcMain, 'handle'>;

interface IpcHandlerDeps {
  aiClient?: AiClient;
  database?: DatabaseContext;
}

export async function registerIpcHandlers(
  bus: IpcMainLike = ipcMain,
  deps: IpcHandlerDeps = {}
) {
  const database = deps.database ?? initializeDatabase();
  let currentSettings = await getAppSettings(database.db);
  const aiClient =
    deps.aiClient ??
    new AiClient({
      apiKey: currentSettings.apiKey,
      model: currentSettings.preferredModel
    });

  if (!deps.aiClient) {
    aiClient.updateConfig({
      apiKey: currentSettings.apiKey,
      model: currentSettings.preferredModel
    });
  }

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
    async (_event, input: AnswerReviewInput): Promise<AnswerReviewResult> =>
      answerReview(database.db, input)
  );

  bus.handle(
    IPC_CHANNELS.dbCreateWord,
    async (_event, input: CreateWordInput): Promise<WordCard> =>
      createWord(database.db, input)
  );

  bus.handle(
    IPC_CHANNELS.dbGetHeatmapActivity,
    async (): Promise<HeatmapActivityRange> => getHeatmapActivity(database.db)
  );

  bus.handle(IPC_CHANNELS.settingsGet, async (): Promise<AppSettings> => {
    const latest = await getAppSettings(database.db);
    if (
      latest.apiKey !== currentSettings.apiKey ||
      latest.preferredModel !== currentSettings.preferredModel
    ) {
      aiClient.updateConfig({
        apiKey: latest.apiKey,
        model: latest.preferredModel
      });
    }
    currentSettings = latest;
    return currentSettings;
  });

  bus.handle(
    IPC_CHANNELS.settingsUpdate,
    async (_event, patch: Partial<AppSettings>): Promise<AppSettings> => {
      const updated = await updateAppSettings(database.db, patch ?? {});
      const shouldSyncAi =
        updated.apiKey !== currentSettings.apiKey ||
        updated.preferredModel !== currentSettings.preferredModel;

      currentSettings = updated;

      if (shouldSyncAi) {
        aiClient.updateConfig({
          apiKey: currentSettings.apiKey,
          model: currentSettings.preferredModel
        });
      }

      return updated;
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
