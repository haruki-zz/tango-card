import { create } from 'zustand';
import type { ReviewCandidate } from '../../domain/review/review_policy';

export interface ReviewQueueState {
  readonly queue: ReviewCandidate[];
  readonly active_index: number;
  readonly reviewed_ids: string[];
}

export interface ReviewQueueActions {
  set_queue(queue: ReviewCandidate[]): void;
  move(direction: 'next' | 'previous'): void;
  mark_reviewed(card_id: string): void;
  reset(): void;
  update_card(card_id: string, updater: (card: ReviewCandidate) => ReviewCandidate): void;
}

export type ReviewQueueStore = ReviewQueueState & ReviewQueueActions;

const INITIAL_STATE: ReviewQueueState = {
  queue: [],
  active_index: 0,
  reviewed_ids: [],
};

export const review_queue_store = create<ReviewQueueStore>((set) => ({
  ...INITIAL_STATE,
  set_queue: (queue: ReviewCandidate[]) =>
    set({
      queue,
      active_index: 0,
      reviewed_ids: [],
    }),
  move: (direction: 'next' | 'previous') =>
    set((state) => {
      if (state.queue.length === 0) {
        return state;
      }
      const delta = direction === 'next' ? 1 : -1;
      const normalized_index = Math.min(
        Math.max(state.active_index + delta, 0),
        state.queue.length - 1,
      );
      return {
        ...state,
        active_index: normalized_index,
      };
    }),
  mark_reviewed: (card_id: string) =>
    set((state) => {
      if (state.reviewed_ids.includes(card_id)) {
        return state;
      }
      return {
        ...state,
        reviewed_ids: [...state.reviewed_ids, card_id],
      };
    }),
  reset: () => set(INITIAL_STATE),
  update_card: (card_id: string, updater: (card: ReviewCandidate) => ReviewCandidate) =>
    set((state) => ({
      ...state,
      queue: state.queue.map((card) => (card.id === card_id ? updater(card) : card)),
    })),
}));
