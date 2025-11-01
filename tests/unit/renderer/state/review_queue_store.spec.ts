import type { ReviewCandidate } from '../../../../src/domain/review/review_policy';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import { review_queue_store } from '../../../../src/renderer_process/state/review_queue_store';

const create_candidate = (id: string): ReviewCandidate => ({
  id,
  svg_source: '<svg></svg>',
  created_at: new Date().toISOString(),
  memory_level: MemoryLevel.SOMEWHAT_FAMILIAR,
  review_count: 0,
  weight: 1,
});

describe('review_queue_store', () => {
  beforeEach(() => {
    review_queue_store.getState().reset();
  });

  it('sets queue and resets active index', () => {
    review_queue_store.setState({ active_index: 4, queue: [] }, false);
    review_queue_store.getState().set_queue([create_candidate('1'), create_candidate('2')]);
    const state = review_queue_store.getState();
    expect(state.queue).toHaveLength(2);
    expect(state.active_index).toBe(0);
  });

  it('removes the active card when advancing', () => {
    review_queue_store.getState().set_queue([create_candidate('1'), create_candidate('2')]);
    review_queue_store.getState().advance();
    const state = review_queue_store.getState();
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].id).toBe('2');
    expect(state.active_index).toBe(0);
  });

  it('updates a card in place when instructed', () => {
    review_queue_store.getState().set_queue([create_candidate('1')]);
    review_queue_store.getState().update_card('1', (card) => ({
      ...card,
      memory_level: MemoryLevel.NEEDS_REINFORCEMENT,
    }));
    const state = review_queue_store.getState();
    expect(state.queue[0].memory_level).toBe(MemoryLevel.NEEDS_REINFORCEMENT);
  });
});
