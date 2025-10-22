import type { ReviewCandidate } from '../../domain/review/review_policy';

export interface ReviewQueueState {
  readonly queue: ReviewCandidate[];
  readonly active_index: number;
}

type ReviewQueueListener = (state: ReviewQueueState) => void;

const INITIAL_STATE: ReviewQueueState = {
  queue: [],
  active_index: 0,
};

export class ReviewQueueStore {
  private state: ReviewQueueState = INITIAL_STATE;
  private readonly listeners = new Set<ReviewQueueListener>();

  subscribe(listener: ReviewQueueListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  get_state(): ReviewQueueState {
    return this.state;
  }

  set_queue(queue: ReviewCandidate[]): void {
    this.update_state({ queue, active_index: 0 });
  }

  advance(): void {
    const next_index = Math.min(this.state.active_index + 1, Math.max(this.state.queue.length - 1, 0));
    this.update_state({ ...this.state, active_index: next_index });
  }

  reset(): void {
    this.update_state(INITIAL_STATE);
  }

  private update_state(next_state: ReviewQueueState): void {
    this.state = next_state;
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const review_queue_store = new ReviewQueueStore();
