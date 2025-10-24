import { create } from 'zustand';
import type { ReviewCandidate } from '../../domain/review/review_policy';

export interface ReviewQueueState {
  readonly queue: ReviewCandidate[];
  readonly active_index: number;
}

export interface ReviewQueueActions {
  set_queue(queue: ReviewCandidate[]): void;
  advance(): void;
  reset(): void;
}

export type ReviewQueueStore = ReviewQueueState & ReviewQueueActions;

const INITIAL_STATE: ReviewQueueState = {
  queue: [],
  active_index: 0,
};

export const review_queue_store = create<ReviewQueueStore>((set) => ({
  ...INITIAL_STATE,
  set_queue: (queue: ReviewCandidate[]) =>
    set({
      queue,
      active_index: 0,
    }),
  advance: () =>
    set((state) => {
      const next_index = Math.min(state.active_index + 1, Math.max(state.queue.length - 1, 0));
      return { ...state, active_index: next_index };
    }),
  reset: () => set(INITIAL_STATE),
}));
