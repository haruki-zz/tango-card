import type { ReviewCandidate } from '../../../../src/domain/review/review_policy';
import { review_queue_store } from '../../../../src/renderer_process/state/review_queue_store';

const create_candidate = (id: string): ReviewCandidate => ({
  id,
  word: '語彙',
  reading: 'ごい',
  context: 'context',
  scene: 'scene',
  example: 'example',
  svg_source: '<svg></svg>',
  created_at: new Date().toISOString(),
  review_count: 0,
  familiarity: 'normal',
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
    expect(state.reviewed_ids).toHaveLength(0);
  });

  it('moves forward and backward without wrapping', () => {
    review_queue_store.getState().set_queue([create_candidate('1'), create_candidate('2')]);
    review_queue_store.getState().move('previous');
    expect(review_queue_store.getState().active_index).toBe(0);
    review_queue_store.getState().move('next');
    expect(review_queue_store.getState().active_index).toBe(1);
    review_queue_store.getState().move('next');
    expect(review_queue_store.getState().active_index).toBe(1);
  });

  it('updates a card in place when instructed', () => {
    review_queue_store.getState().set_queue([create_candidate('1')]);
    review_queue_store.getState().update_card('1', (card) => ({
      ...card,
      review_count: card.review_count + 1,
    }));
    const state = review_queue_store.getState();
    expect(state.queue[0].review_count).toBe(1);
  });

  it('marks cards as reviewed without duplicates', () => {
    review_queue_store.getState().set_queue([create_candidate('1')]);
    review_queue_store.getState().mark_reviewed('1');
    review_queue_store.getState().mark_reviewed('1');
    expect(review_queue_store.getState().reviewed_ids).toEqual(['1']);
  });
});
