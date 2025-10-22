import { WeightedMemoryReviewPolicy } from '../../../src/domain/review/review_policy';
import { MemoryLevel } from '../../../src/domain/review/memory_level';
import type { CardEntity } from '../../../src/domain/card/card_entity';

const policy = new WeightedMemoryReviewPolicy();

function create_card(id: string, level: MemoryLevel, review_count = 0): CardEntity {
  return {
    id,
    svg_source: `<svg id="${id}"></svg>`,
    created_at: new Date().toISOString(),
    tags: [],
    memory_level: level,
    review_count,
    last_reviewed_at: undefined,
  };
}

describe('WeightedMemoryReviewPolicy', () => {
  it('prioritises cards with lower memory level', () => {
    const queue = policy.generate_review_queue([
      create_card('1', MemoryLevel.WELL_KNOWN),
      create_card('2', MemoryLevel.NEEDS_REINFORCEMENT),
      create_card('3', MemoryLevel.SOMEWHAT_FAMILIAR),
    ]);

    expect(queue[0].id).toBe('2');
  });

  it('increments review count on update', () => {
    const card = create_card('card', MemoryLevel.NEEDS_REINFORCEMENT);
    const updated = policy.update_memory_level(card, MemoryLevel.WELL_KNOWN);
    expect(updated.review_count).toBe(card.review_count + 1);
    expect(updated.memory_level).toBe(MemoryLevel.WELL_KNOWN);
  });
});
