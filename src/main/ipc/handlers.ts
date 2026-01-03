import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import {
  createProviderOrMock,
  type AiProvider,
  type ProviderConfig,
} from '@main/ai';
import {
  normalizePositiveInteger,
  normalizeProviderSettings,
  toSafeProviderSettings,
  type ProviderSettingsStore,
} from '@main/provider-settings';
import { FileStorage, type WordInput } from '@main/storage';
import {
  IPC_CHANNELS,
  type AddWordPayload,
  type GenerateWordPayload,
  type IpcChannel,
  type IpcRequestMap,
  type IpcResponseMap,
  type ReviewSubmitPayload,
  type ImportDataPayload,
} from '@shared/ipc';
import { buildReviewQueue, updateSm2 } from '@shared/sm2';
import type { WordEntry } from '@shared/types';

type IpcHandler<K extends IpcChannel> = (
  event: IpcMainInvokeEvent,
  payload: IpcRequestMap[K],
) => Promise<IpcResponseMap[K]>;

type HandlerMap = {
  [K in IpcChannel]: IpcHandler<K>;
};

interface HandlerOptions {
  storage: FileStorage;
  getNow?: () => Date;
  createProvider?: (config: ProviderConfig) => AiProvider;
  providerStore?: ProviderSettingsStore;
  initialProviderConfig?: ProviderConfig;
  ipc?: Pick<typeof ipcMain, 'handle' | 'removeHandler'>;
}

const defaultNow = () => new Date();

const ensureNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} 必须是非空字符串`);
  }
  return value.trim();
};

const ensureIsoDate = (value: unknown, field: string, fallback: Date) => {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  if (value === undefined) {
    return fallback.toISOString();
  }
  throw new Error(`${field} 必须是有效的 ISO 日期字符串`);
};

const ensureScore = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('score 必须是数字');
  }
  const rounded = Math.floor(value);
  if (rounded < 0 || rounded > 5) {
    throw new Error('score 必须在 0-5 之间');
  }
  return rounded;
};

const toWordInput = (payload: AddWordPayload, now: Date): WordInput => ({
  id: ensureNonEmptyString(payload.id, 'id'),
  word: ensureNonEmptyString(payload.word, 'word'),
  hiragana: ensureNonEmptyString(payload.hiragana, 'hiragana'),
  definition_ja: ensureNonEmptyString(payload.definition_ja, 'definition_ja'),
  example_ja: ensureNonEmptyString(payload.example_ja, 'example_ja'),
  created_at: ensureIsoDate(payload.created_at, 'created_at', now),
  sm2: payload.sm2,
});

const normalizeGeneratePayload = (payload: GenerateWordPayload) => ({
  word: ensureNonEmptyString(payload.word, 'word'),
  maxOutputChars: normalizePositiveInteger(payload.maxOutputChars),
});

const normalizeReviewPayload = (
  payload: ReviewSubmitPayload,
  now: Date,
): {
  wordId: string;
  sessionId: string;
  score: number;
  reviewedAt: string;
} => ({
  wordId: ensureNonEmptyString(payload.wordId, 'wordId'),
  sessionId: ensureNonEmptyString(payload.sessionId, 'sessionId'),
  score: ensureScore(payload.score),
  reviewedAt: now.toISOString(),
});

const normalizeImportPayload = (payload: ImportDataPayload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('导入参数缺失');
  }

  if (payload.format !== 'json' && payload.format !== 'jsonl') {
    throw new Error('导入 format 仅支持 json/jsonl');
  }

  return {
    content: ensureNonEmptyString(payload.content, 'content'),
    format: payload.format,
  };
};

export const registerIpcHandlers = ({
  storage,
  getNow = defaultNow,
  createProvider = createProviderOrMock,
  providerStore,
  initialProviderConfig,
  ipc = ipcMain,
}: HandlerOptions) => {
  let providerConfig: ProviderConfig =
    initialProviderConfig ?? { provider: 'mock' };

  const resolveHasKey = async () => {
    if (providerConfig.provider === 'mock') {
      return false;
    }

    if (providerConfig.apiKey) {
      return true;
    }

    if (!providerStore) {
      return false;
    }

    return providerStore.hasApiKey(providerConfig.provider);
  };

  const handlers: HandlerMap = {
    [IPC_CHANNELS.LIST_WORDS]: async () => storage.loadWords(getNow()),

    [IPC_CHANNELS.ADD_WORD]: async (_event, payload) => {
      const now = getNow();
      const word = await storage.addWord(toWordInput(payload, now), now);
      return word;
    },

    [IPC_CHANNELS.GENERATE_WORD]: async (_event, payload) => {
      const request = normalizeGeneratePayload(payload);
      const provider = createProvider(providerConfig);
      return provider.generateWordContent(request);
    },

    [IPC_CHANNELS.REVIEW_QUEUE]: async () => {
      const now = getNow();
      const words = await storage.loadWords(now);
      return buildReviewQueue(words, now);
    },

    [IPC_CHANNELS.SUBMIT_REVIEW]: async (_event, payload) => {
      const now = getNow();
      const input = normalizeReviewPayload(payload, now);
      const words = await storage.loadWords(now);
      const index = words.findIndex((word) => word.id === input.wordId);
      if (index === -1) {
        throw new Error(`未找到词条 ${input.wordId}`);
      }

      const updated: WordEntry = {
        ...words[index],
        sm2: updateSm2(words[index].sm2, input.score, now),
      };
      const nextWords = [...words];
      nextWords[index] = updated;
      await storage.saveWords(nextWords, now);

      const log = await storage.appendReviewLog(
        {
          session_id: input.sessionId,
          word_id: input.wordId,
          score: input.score,
          reviewed_at: input.reviewedAt,
        },
        now,
      );

      return { word: updated, log };
    },

    [IPC_CHANNELS.ACTIVITY_GET]: async () => storage.loadActivity(),

    [IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION]: async (_event, payload) => {
      const date = payload?.date;
      const target = date
        ? ensureIsoDate(date, 'date', getNow())
        : getNow().toISOString();
      return storage.incrementSession(target);
    },

    [IPC_CHANNELS.SET_PROVIDER]: async (_event, payload) => {
      const normalized = normalizeProviderSettings(payload);
      providerConfig = providerStore
        ? await providerStore.save(normalized)
        : normalized;
      const hasKey = await resolveHasKey();
      return toSafeProviderSettings(providerConfig, hasKey);
    },

    [IPC_CHANNELS.GET_PROVIDER]: async () => {
      if (providerStore) {
        providerConfig = await providerStore.load();
      }
      const hasKey = await resolveHasKey();
      return toSafeProviderSettings(providerConfig, hasKey);
    },

    [IPC_CHANNELS.EXPORT_DATA]: async () => storage.exportWords(getNow()),

    [IPC_CHANNELS.IMPORT_DATA]: async (_event, payload) => {
      const now = getNow();
      const input = normalizeImportPayload(payload);
      return storage.importWords(input.content, input.format, now);
    },
  };

  (Object.keys(handlers) as IpcChannel[]).forEach((channel) => {
    ipc.removeHandler(channel);
    ipc.handle(channel, handlers[channel]);
  });

  const dispose = () => {
    (Object.keys(handlers) as IpcChannel[]).forEach((channel) => {
      ipc.removeHandler(channel);
    });
  };

  const invoke = async <K extends IpcChannel>(
    channel: K,
    payload: IpcRequestMap[K],
  ): Promise<IpcResponseMap[K]> => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`未注册的信道 ${channel}`);
    }
    return handler({} as IpcMainInvokeEvent, payload);
  };

  return { dispose, invoke };
};
