import type { CardEntity } from '../card/card_entity';
import { MemoryLevel, MEMORY_LEVEL_WEIGHTS } from './memory_level';

export interface ReviewCandidate extends CardEntity {
  readonly weight: number;
}

export interface ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size?: number): ReviewCandidate[];
  update_memory_level(card: CardEntity, new_level: MemoryLevel): CardEntity;
}

export class WeightedMemoryReviewPolicy implements ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size = 10): ReviewCandidate[] {
    const candidates = cards
      .map((card) => ({ ...card, weight: this.calculate_weight(card) }))
      .sort((left, right) => right.weight - left.weight);

    return candidates.slice(0, size);
  }

  update_memory_level(card: CardEntity, new_level: MemoryLevel): CardEntity {
    return {
      ...card,
      memory_level: new_level,
      review_count: card.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    };
  }

  private calculate_weight(card: CardEntity): number {
    const base_weight = MEMORY_LEVEL_WEIGHTS[card.memory_level] ?? 1;
    const decay = Math.max(1, card.review_count);
    return base_weight + 1 / decay;
  }
}
