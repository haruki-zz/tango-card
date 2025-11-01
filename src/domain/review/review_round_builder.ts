import type { CardEntity } from '../card/card_entity';
import { MemoryLevel, MEMORY_LEVEL_WEIGHTS } from './memory_level';
import type { ReviewCandidate } from './review_policy';

export const DEFAULT_REVIEW_ROUND_SIZE = 30;
export const DEFAULT_REVIEW_RATIO: Record<MemoryLevel, number> = {
  [MemoryLevel.WELL_KNOWN]: 1,
  [MemoryLevel.SOMEWHAT_FAMILIAR]: 3,
  [MemoryLevel.NEEDS_REINFORCEMENT]: 6,
};

interface BuildReviewRoundOptions {
  readonly size?: number;
  readonly ratio?: Partial<Record<MemoryLevel, number>>;
  readonly random?: () => number;
}

export function build_review_round(
  cards: CardEntity[],
  options: BuildReviewRoundOptions = {},
): ReviewCandidate[] {
  if (cards.length === 0) {
    return [];
  }

  const random = options.random ?? Math.random;
  const target_size = Math.max(1, options.size ?? DEFAULT_REVIEW_ROUND_SIZE);
  if (cards.length <= target_size) {
    return shuffle([...cards], random).map(create_candidate);
  }

  const ratio = {
    ...DEFAULT_REVIEW_RATIO,
    ...options.ratio,
  };

  const grouped: Record<MemoryLevel, CardEntity[]> = {
    [MemoryLevel.WELL_KNOWN]: [],
    [MemoryLevel.SOMEWHAT_FAMILIAR]: [],
    [MemoryLevel.NEEDS_REINFORCEMENT]: [],
  };

  cards.forEach((card) => {
    grouped[card.memory_level]?.push(card);
  });

  const ratio_sum = Object.values(ratio).reduce((sum, value) => sum + value, 0);
  const desired_counts: Record<MemoryLevel, number> = {
    [MemoryLevel.WELL_KNOWN]: 0,
    [MemoryLevel.SOMEWHAT_FAMILIAR]: 0,
    [MemoryLevel.NEEDS_REINFORCEMENT]: 0,
  };

  const fraction_entries: Array<{ level: MemoryLevel; fraction: number }> = [];
  let assigned = 0;
  (Object.keys(ratio) as MemoryLevel[]).forEach((level) => {
    const weight = ratio[level];
    if (weight <= 0) {
      return;
    }
    const exact = (weight / ratio_sum) * target_size;
    const base = Math.floor(exact);
    desired_counts[level] = base;
    assigned += base;
    fraction_entries.push({ level, fraction: exact - base });
  });

  let remaining = Math.max(0, target_size - assigned);
  fraction_entries
    .sort((left, right) => right.fraction - left.fraction)
    .forEach((entry) => {
      if (remaining <= 0) {
        return;
      }
      desired_counts[entry.level] += 1;
      remaining -= 1;
    });

  const selections: CardEntity[] = [];
  const leftovers: CardEntity[] = [];
  let deficit = 0;

  (Object.keys(grouped) as MemoryLevel[]).forEach((level) => {
    const pool = shuffle([...grouped[level]], random);
    const target = Math.min(pool.length, desired_counts[level]);
    if (target > 0) {
      selections.push(...pool.splice(0, target));
    }
    if (target < desired_counts[level]) {
      deficit += desired_counts[level] - target;
    }
    leftovers.push(...pool);
  });

  if (deficit > 0 && leftovers.length > 0) {
    const fill_candidates = shuffle(leftovers, random);
    selections.push(...fill_candidates.slice(0, Math.min(deficit, fill_candidates.length)));
  }

  if (selections.length > target_size) {
    return shuffle(selections, random)
      .slice(0, target_size)
      .map(create_candidate);
  }

  return selections.map(create_candidate);
}

function create_candidate(card: CardEntity): ReviewCandidate {
  return {
    ...card,
    weight: MEMORY_LEVEL_WEIGHTS[card.memory_level] ?? 1,
  };
}

function shuffle<T>(source: T[], random: () => number): T[] {
  const array = [...source];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swap_index = Math.floor(random() * (index + 1));
    [array[index], array[swap_index]] = [array[swap_index], array[index]];
  }
  return array;
}
