import { build_review_round, DEFAULT_REVIEW_ROUND_SIZE } from '../../../src/domain/review/review_round_builder';
import { MemoryLevel } from '../../../src/domain/review/memory_level';
import type { CardEntity } from '../../../src/domain/card/card_entity';

describe('build_review_round', () => {
  const create_card = (id: string, level: MemoryLevel): CardEntity => ({
    id,
    svg_source: `<svg id="${id}"></svg>`,
    created_at: '2025-02-20T00:00:00.000Z',
    memory_level: level,
    review_count: 0,
    last_reviewed_at: undefined,
  });

  it('selects cards using the configured ratio when supply is sufficient', () => {
    const cards: CardEntity[] = [];
    for (let index = 0; index < 20; index += 1) {
      cards.push(create_card(`well-${index}`, MemoryLevel.WELL_KNOWN));
    }
    for (let index = 0; index < 20; index += 1) {
      cards.push(create_card(`somewhat-${index}`, MemoryLevel.SOMEWHAT_FAMILIAR));
    }
    for (let index = 0; index < 20; index += 1) {
      cards.push(create_card(`needs-${index}`, MemoryLevel.NEEDS_REINFORCEMENT));
    }

    const random = jest.fn().mockReturnValue(0.42);
    const round = build_review_round(cards, { random });

    const counts = round.reduce(
      (acc, card) => {
        acc[card.memory_level] += 1;
        return acc;
      },
      {
        [MemoryLevel.WELL_KNOWN]: 0,
        [MemoryLevel.SOMEWHAT_FAMILIAR]: 0,
        [MemoryLevel.NEEDS_REINFORCEMENT]: 0,
      },
    );

    expect(round).toHaveLength(DEFAULT_REVIEW_ROUND_SIZE);
    expect(counts[MemoryLevel.WELL_KNOWN]).toBe(3);
    expect(counts[MemoryLevel.SOMEWHAT_FAMILIAR]).toBe(9);
    expect(counts[MemoryLevel.NEEDS_REINFORCEMENT]).toBe(18);
  });

  it('fills remaining slots when some levels are short on cards', () => {
    const cards: CardEntity[] = [
      create_card('well-1', MemoryLevel.WELL_KNOWN),
      create_card('somewhat-1', MemoryLevel.SOMEWHAT_FAMILIAR),
      create_card('somewhat-2', MemoryLevel.SOMEWHAT_FAMILIAR),
      create_card('needs-1', MemoryLevel.NEEDS_REINFORCEMENT),
    ];

    const round = build_review_round(cards, { size: 6, random: () => 0.1 });

    expect(round).toHaveLength(4);
    expect(round.map((card) => card.id).sort()).toEqual(['needs-1', 'somewhat-1', 'somewhat-2', 'well-1']);
  });
});
