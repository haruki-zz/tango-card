import type {
  ActivityRange,
  ActivityStat,
  AiGenerateInput,
  AiGenerateResult,
  ElectronAPI,
  ReviewSessionInput,
  Word,
  WordInput,
  WordListOptions
} from '../types/ipc';
import { IPC_CHANNELS } from './ipc-channels';

export type IpcInvoker = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

const invokeThrough = <ReturnType>(
  ipc: IpcInvoker,
  channel: string,
  ...args: unknown[]
) => ipc.invoke(channel, ...args) as Promise<ReturnType>;

export const createPreloadApi = (ipc: IpcInvoker): ElectronAPI => ({
  word: {
    add: (payload: WordInput) => invokeThrough<void>(ipc, IPC_CHANNELS.word.add, payload),
    listRandom: (options?: WordListOptions) =>
      invokeThrough<Word[]>(ipc, IPC_CHANNELS.word.listRandom, options)
  },
  review: {
    create: (input: ReviewSessionInput) =>
      invokeThrough<void>(ipc, IPC_CHANNELS.review.create, input)
  },
  activity: {
    stats: (range?: ActivityRange) =>
      invokeThrough<ActivityStat[]>(ipc, IPC_CHANNELS.activity.stats, range)
  },
  ai: {
    generateForWord: (input: AiGenerateInput) =>
      invokeThrough<AiGenerateResult>(ipc, IPC_CHANNELS.ai.generateForWord, input)
  }
});

export const freezePreloadApi = (api: ElectronAPI): ElectronAPI =>
  Object.freeze({
    word: Object.freeze(api.word),
    review: Object.freeze(api.review),
    activity: Object.freeze(api.activity),
    ai: Object.freeze(api.ai)
  });
