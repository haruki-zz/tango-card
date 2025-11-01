import { WeightedMemoryReviewPolicy } from '../../../src/domain/review/review_policy';
import { MemoryLevel } from '../../../src/domain/review/memory_level';
import type { CardEntity } from '../../../src/domain/card/card_entity';

const policy = new WeightedMemoryReviewPolicy();

function create_card(id: string, level: MemoryLevel, review_count = 0): CardEntity {
  return {
    id,
    word: `word-${id}`,
    reading: `reading-${id}`,
    context: `context-${id}`,
    scene: `scene-${id}`,
    example: `example-${id}`,
    created_at: new Date().toISOString(),
    memory_level: level,
    review_count,
    last_reviewed_at: undefined,
  };
}

describe('WeightedMemoryReviewPolicy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('selects cards using weighted randomness favouring lower familiarity', () => {
    const random_spy = jest
      .spyOn(global.Math, 'random')
      .mockReturnValueOnce(0.3) // pick NEEDS_REINFORCEMENT first (weight window 2-8)
      .mockReturnValueOnce(0.6) // pick SOMEWHAT_FAMILIAR second
      .mockReturnValue(0.0); // remaining picks

    const queue = policy.generate_review_queue(
      [
        create_card('1', MemoryLevel.WELL_KNOWN),
        create_card('2', MemoryLevel.NEEDS_REINFORCEMENT),
        create_card('3', MemoryLevel.SOMEWHAT_FAMILIAR),
      ],
      3,
    );

    expect(random_spy).toHaveBeenCalled();
    expect(queue).toHaveLength(3);
    expect(queue[0].id).toBe('2');
    expect(queue.map((card) => card.id)).toEqual(['2', '3', '1']);
    expect(queue[0].svg_source).toContain('<svg');
  });

  it('increments review count on update', () => {
    const card = create_card('card', MemoryLevel.NEEDS_REINFORCEMENT);
    const updated = policy.update_memory_level(card, MemoryLevel.WELL_KNOWN);
    expect(updated.review_count).toBe(card.review_count + 1);
    expect(updated.memory_level).toBe(MemoryLevel.WELL_KNOWN);
  });
});
