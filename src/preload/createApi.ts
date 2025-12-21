import { IPC_CHANNELS } from '../shared/ipcChannels';
import {
  AppSettings,
  ExposedApi,
  ImportResult,
  AnswerReviewInput,
  AnswerReviewResult,
  GenerateWordDataResult,
  WordCard,
  ExportResult,
  CreateWordInput
} from '../shared/apiTypes';

type Invoke = <T>(
  channel: string,
  ...args: unknown[]
) => Promise<T>;

export function createPreloadApi(invoke: Invoke): ExposedApi {
  return {
    ping: () => 'pong',
    ai: {
      generateWordData: (term: string) =>
        invoke<GenerateWordDataResult>(IPC_CHANNELS.aiGenerateWordData, term)
    },
    db: {
      getTodayQueue: () => invoke<WordCard[]>(IPC_CHANNELS.dbGetTodayQueue),
      answerReview: (input: AnswerReviewInput) =>
        invoke<AnswerReviewResult>(IPC_CHANNELS.dbAnswerReview, input),
      createWord: (input: CreateWordInput) =>
        invoke<WordCard>(IPC_CHANNELS.dbCreateWord, input)
    },
    settings: {
      getSettings: () => invoke<AppSettings>(IPC_CHANNELS.settingsGet),
      updateSettings: (patch: Partial<AppSettings>) =>
        invoke<AppSettings>(IPC_CHANNELS.settingsUpdate, patch)
    },
    files: {
      importWords: (filePath: string) =>
        invoke<ImportResult>(IPC_CHANNELS.filesImport, filePath),
      exportBackup: () => invoke<ExportResult>(IPC_CHANNELS.filesExport)
    }
  };
}
