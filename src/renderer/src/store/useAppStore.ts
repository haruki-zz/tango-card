import { create, type StateCreator } from 'zustand';

import {
  type AddWordPayload,
  type ExportDataResponse,
  type GeneratedWordContent,
  type GenerateWordPayload,
  type ImportDataPayload,
  type ImportDataResponse,
  type ProviderSettings,
  type RendererApi,
  type SafeProviderSettings,
} from '@shared/ipc';
import type { ActivityByDay, ReviewLog, WordEntry } from '@shared/types';

type StoreDeps = {
  getApi: () => RendererApi;
  createSessionId: () => string;
};

interface AppState {
  words: WordEntry[];
  reviewQueue: WordEntry[];
  activity: ActivityByDay;
  provider: SafeProviderSettings | null;
  sessionId: string | null;
}

interface AppActions {
  loadWords: () => Promise<WordEntry[]>;
  addWord: (payload: AddWordPayload) => Promise<WordEntry>;
  generateWordContent: (
    payload: GenerateWordPayload
  ) => Promise<GeneratedWordContent>;
  loadReviewQueue: () => Promise<WordEntry[]>;
  submitReview: (
    wordId: string,
    score: number
  ) => Promise<{ word: WordEntry; log: ReviewLog }>;
  completeSession: (date?: string) => Promise<ActivityByDay>;
  refreshActivity: () => Promise<ActivityByDay>;
  setProvider: (settings: ProviderSettings) => Promise<SafeProviderSettings>;
  exportData: () => Promise<ExportDataResponse>;
  importData: (payload: ImportDataPayload) => Promise<ImportDataResponse>;
  resetReviewSession: () => void;
}

export type AppStore = AppState & AppActions;

const resolveRendererApi = (): RendererApi => {
  const api = (
    globalThis as typeof globalThis & { window?: { api?: RendererApi } }
  ).window?.api;

  if (!api) {
    throw new Error('渲染端 API 未初始化');
  }

  return api;
};

const defaultSessionId = () => crypto.randomUUID();

const upsertWord = (words: WordEntry[], updated: WordEntry) => {
  const index = words.findIndex((item) => item.id === updated.id);
  if (index === -1) {
    return [...words, updated];
  }
  const next = [...words];
  next[index] = updated;
  return next;
};

const createStoreState =
  (deps: StoreDeps): StateCreator<AppStore> =>
  (set, get) => ({
    words: [],
    reviewQueue: [],
    activity: {},
    provider: null,
    sessionId: null,

    loadWords: async () => {
      const words = await deps.getApi().listWords();
      set({ words });
      return words;
    },

    addWord: async (payload) => {
      const word = await deps.getApi().addWord(payload);
      set((state) => ({ words: upsertWord(state.words, word) }));
      return word;
    },

    generateWordContent: (payload) => deps.getApi().generateWordContent(payload),

    loadReviewQueue: async () => {
      const queue = await deps.getApi().getReviewQueue();
      set((state) => ({
        reviewQueue: queue,
        sessionId:
          queue.length > 0
            ? state.sessionId ?? deps.createSessionId()
            : state.sessionId,
      }));
      return queue;
    },

    submitReview: async (wordId, score) => {
      const api = deps.getApi();
      const sessionId = get().sessionId ?? deps.createSessionId();
      if (!get().sessionId) {
        set({ sessionId });
      }
      const result = await api.submitReview({ wordId, score, sessionId });
      set((state) => ({
        words: upsertWord(state.words, result.word),
        reviewQueue: state.reviewQueue.filter((item) => item.id !== wordId),
      }));
      return result;
    },

    completeSession: async (date) => {
      const sessionId = get().sessionId;
      if (!sessionId) {
        throw new Error('当前没有进行中的复习 session');
      }
      const activity = await deps.getApi().incrementSession(date);
      set({ sessionId: null, reviewQueue: [], activity });
      return activity;
    },

    refreshActivity: async () => {
      const activity = await deps.getApi().getActivity();
      set({ activity });
      return activity;
    },

    setProvider: async (settings) => {
      const provider = await deps.getApi().setProvider(settings);
      set({ provider });
      return provider;
    },

    exportData: () => deps.getApi().exportData(),

    importData: async (payload) => {
      const result = await deps.getApi().importData(payload);
      const words = await deps.getApi().listWords();
      set({ words });
      return result;
    },

    resetReviewSession: () => set({ sessionId: null, reviewQueue: [] }),
  });

export const createAppStore = (deps: Partial<StoreDeps> = {}) => {
  const resolvedDeps: StoreDeps = {
    getApi: deps.getApi ?? resolveRendererApi,
    createSessionId: deps.createSessionId ?? defaultSessionId,
  };
  return create<AppStore>(createStoreState(resolvedDeps));
};

export const useAppStore = createAppStore();
