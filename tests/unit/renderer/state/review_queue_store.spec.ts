import type { ReviewCandidate } from '../../../../src/domain/review/review_policy';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import { review_queue_store } from '../../../../src/renderer_process/state/review_queue_store';

const create_candidate = (id: string): ReviewCandidate => ({
  id,
  svg_source: '<svg></svg>',
  created_at: new Date().toISOString(),
  tags: [],
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

  it('advances but never exceeds queue bounds', () => {
    review_queue_store.getState().set_queue([create_candidate('1')]);
    review_queue_store.getState().advance();
    review_queue_store.getState().advance();
    const state = review_queue_store.getState();
    expect(state.active_index).toBe(0);
  });
});
