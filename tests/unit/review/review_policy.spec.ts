import { SimpleReviewPolicy } from '../../../src/domain/review/review_policy';
import type { CardEntity } from '../../../src/domain/card/card_entity';

const policy = new SimpleReviewPolicy();

function create_card(id: string, review_count = 0, familiarity: CardEntity['familiarity'] = 'normal'): CardEntity {
  return {
    id,
    word: `word-${id}`,
    reading: `reading-${id}`,
    context: `context-${id}`,
    scene: `scene-${id}`,
    example: `example-${id}`,
    created_at: new Date().toISOString(),
    review_count,
    familiarity,
    last_reviewed_at: undefined,
  };
}

describe('SimpleReviewPolicy', () => {
  it('returns a shuffled queue with svg sources for both faces', () => {
    const queue = policy.generate_review_queue(
      [create_card('1'), create_card('2'), create_card('3')],
      2,
    );
    expect(queue).toHaveLength(2);
    expect(queue[0].front_svg_source).toContain('card-front');
    expect(queue[0].back_svg_source).toContain('card-back');
  });

  it('prioritizes not-familiar cards roughly 2:1 when generating a round', () => {
    const not_familiar_cards = Array.from({ length: 30 }, (_, index) =>
      create_card(`nf-${index}`, 0, 'not_familiar'),
    );
    const familiar_cards = Array.from({ length: 30 }, (_, index) =>
      create_card(`f-${index}`, 0, 'normal'),
    );
    const queue = policy.generate_review_queue([...not_familiar_cards, ...familiar_cards], 30);
    const not_familiar_count = queue.filter((card) => card.familiarity === 'not_familiar').length;
    expect(queue).toHaveLength(30);
    expect(not_familiar_count).toBeGreaterThanOrEqual(18);
    expect(not_familiar_count).toBeLessThanOrEqual(30);
  });

  it('marks cards as reviewed', () => {
    const card = create_card('card');
    const updated = policy.mark_reviewed(card);
    expect(updated.review_count).toBe(card.review_count + 1);
    expect(typeof updated.last_reviewed_at).toBe('string');
  });
});
