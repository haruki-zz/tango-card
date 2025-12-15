import { useStore } from "zustand";
import {
  StoreApi,
  createStore,
} from "zustand/vanilla";

import { ActivityLog, WordEntry } from "../types";

type WordMap = Record<string, WordEntry>;
type ActivityMap = Record<string, ActivityLog>;

export interface AppState {
  wordsById: WordMap;
  reviewQueue: string[];
  activityByDate: ActivityMap;
}

export interface AppActions {
  setWords: (words: WordEntry[]) => void;
  upsertWord: (entry: WordEntry) => void;
  removeWord: (id: string) => void;
  getWord: (id: string) => WordEntry | undefined;
  listWords: () => WordEntry[];
  setReviewQueue: (ids: string[]) => void;
  enqueueReview: (ids: string[]) => void;
  popNextReviewWord: () => WordEntry | undefined;
  clearReviewQueue: () => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  incrementActivity: (
    date: string,
    deltas: { addDelta?: number; reviewDelta?: number },
  ) => ActivityLog;
  getActivityLog: (date: string) => ActivityLog | undefined;
  listActivityLogs: () => ActivityLog[];
  reset: () => void;
}

export type AppStore = StoreApi<AppState & AppActions>;

const mapWords = (words: WordEntry[]): WordMap =>
  words.reduce<WordMap>((acc, word) => {
    acc[word.id] = word;
    return acc;
  }, {});

const mapActivities = (logs: ActivityLog[]): ActivityMap =>
  logs.reduce<ActivityMap>((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {});

const dedupeQueue = (queue: string[], wordsById: WordMap) => {
  const seen = new Set<string>();
  return queue.reduce<string[]>((acc, id) => {
    if (seen.has(id) || !wordsById[id]) {
      return acc;
    }
    seen.add(id);
    acc.push(id);
    return acc;
  }, []);
};

const buildInitialState = (overrides?: Partial<AppState>): AppState => ({
  wordsById: overrides?.wordsById ?? {},
  reviewQueue: overrides?.reviewQueue ?? [],
  activityByDate: overrides?.activityByDate ?? {},
});

export const createAppStore = (
  initialState?: Partial<AppState>,
): AppStore => {
  const baseState = buildInitialState(initialState);

  return createStore<AppState & AppActions>((set, get) => ({
    ...baseState,
    setWords: (words) => {
      const wordsById = mapWords(words);
      set({
        wordsById,
        reviewQueue: dedupeQueue(get().reviewQueue, wordsById),
      });
    },
    upsertWord: (entry) =>
      set((state) => ({
        wordsById: {
          ...state.wordsById,
          [entry.id]: entry,
        },
      })),
    removeWord: (id) =>
      set((state) => {
        if (!state.wordsById[id]) {
          return state;
        }

        const { [id]: _removed, ...rest } = state.wordsById;

        return {
          wordsById: rest,
          reviewQueue: state.reviewQueue.filter(
            (queuedId) => queuedId !== id,
          ),
        };
      }),
    getWord: (id) => get().wordsById[id],
    listWords: () => Object.values(get().wordsById),
    setReviewQueue: (ids) =>
      set((state) => ({
        reviewQueue: dedupeQueue(ids, state.wordsById),
      })),
    enqueueReview: (ids) =>
      set((state) => {
        const existingQueue = dedupeQueue(
          state.reviewQueue,
          state.wordsById,
        );
        const seen = new Set(existingQueue);
        const nextQueue = [...existingQueue];

        ids.forEach((id) => {
          if (!state.wordsById[id] || seen.has(id)) {
            return;
          }
          seen.add(id);
          nextQueue.push(id);
        });

        return { reviewQueue: nextQueue };
      }),
    popNextReviewWord: () => {
      const { reviewQueue, wordsById } = get();
      const nextQueue = [...reviewQueue];
      let nextWord: WordEntry | undefined;

      while (nextQueue.length > 0 && !nextWord) {
        const candidateId = nextQueue.shift() as string | undefined;
        if (!candidateId) {
          break;
        }
        nextWord = wordsById[candidateId];
      }

      set({ reviewQueue: dedupeQueue(nextQueue, wordsById) });
      return nextWord;
    },
    clearReviewQueue: () => set({ reviewQueue: [] }),
    setActivityLogs: (logs) =>
      set({
        activityByDate: mapActivities(logs),
      }),
    incrementActivity: (date, deltas) => {
      const addDelta = deltas.addDelta ?? 0;
      const reviewDelta = deltas.reviewDelta ?? 0;
      const current =
        get().activityByDate[date] ??
        ({
          date,
          addCount: 0,
          reviewCount: 0,
        } as ActivityLog);

      const updated: ActivityLog = {
        ...current,
        addCount: current.addCount + addDelta,
        reviewCount: current.reviewCount + reviewDelta,
      };

      set((state) => ({
        activityByDate: {
          ...state.activityByDate,
          [date]: updated,
        },
      }));

      return updated;
    },
    getActivityLog: (date) => get().activityByDate[date],
    listActivityLogs: () => Object.values(get().activityByDate),
    reset: () => set(buildInitialState(initialState)),
  }));
};

export const appStore = createAppStore();

export const useAppStore = <T>(
  selector: (state: AppState & AppActions) => T,
): T => useStore(appStore, selector);
