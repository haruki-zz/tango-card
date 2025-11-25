import { SimpleReviewPolicy } from '../../../src/domain/review/review_policy';
import type { CardEntity } from '../../../src/domain/card/card_entity';

const policy = new SimpleReviewPolicy();

function create_card(id: string, review_count = 0): CardEntity {
  return {
    id,
    word: `word-${id}`,
    reading: `reading-${id}`,
    context: `context-${id}`,
    scene: `scene-${id}`,
    example: `example-${id}`,
    created_at: new Date().toISOString(),
    review_count,
    familiarity: 'normal',
    last_reviewed_at: undefined,
  };
}

describe('SimpleReviewPolicy', () => {
  it('returns a shuffled queue with svg sources', () => {
    const queue = policy.generate_review_queue(
      [create_card('1'), create_card('2'), create_card('3')],
      2,
    );
    expect(queue).toHaveLength(2);
    expect(queue[0].svg_source).toContain('<svg');
  });

  it('marks cards as reviewed', () => {
    const card = create_card('card');
    const updated = policy.mark_reviewed(card);
    expect(updated.review_count).toBe(card.review_count + 1);
    expect(typeof updated.last_reviewed_at).toBe('string');
  });
});
