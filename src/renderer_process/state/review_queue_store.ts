import { create } from 'zustand';
import type { ReviewCandidate } from '../../domain/review/review_policy';

export interface ReviewQueueState {
  readonly queue: ReviewCandidate[];
  readonly active_index: number;
}

export interface ReviewQueueActions {
  set_queue(queue: ReviewCandidate[]): void;
  advance(): void;
  move(direction: 'next' | 'previous'): void;
  reset(): void;
  update_card(card_id: string, updater: (card: ReviewCandidate) => ReviewCandidate): void;
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
      if (state.queue.length === 0) {
        return state;
      }
      const next_queue = state.queue.filter((_, index) => index !== state.active_index);
      const next_index = next_queue.length === 0 ? 0 : Math.min(state.active_index, next_queue.length - 1);
      return {
        queue: next_queue,
        active_index: next_index,
      };
    }),
  move: (direction: 'next' | 'previous') =>
    set((state) => {
      if (state.queue.length <= 1) {
        return state;
      }
      const delta = direction === 'next' ? 1 : -1;
      const normalized_index =
        (state.active_index + delta + state.queue.length) % state.queue.length;
      return {
        ...state,
        active_index: normalized_index,
      };
    }),
  reset: () => set(INITIAL_STATE),
  update_card: (card_id: string, updater: (card: ReviewCandidate) => ReviewCandidate) =>
    set((state) => ({
      ...state,
      queue: state.queue.map((card) => (card.id === card_id ? updater(card) : card)),
    })),
}));
