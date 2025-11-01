import type { CardEntity } from '../card/card_entity';
import { MemoryLevel, MEMORY_LEVEL_WEIGHTS } from './memory_level';
import { render_card_svg } from '../../shared/templates/card_svg_template';

export interface ReviewCandidate extends CardEntity {
  readonly svg_source: string;
  readonly weight: number;
}

export interface ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size?: number): ReviewCandidate[];
  update_memory_level(card: CardEntity, new_level: MemoryLevel): CardEntity;
}

export class WeightedMemoryReviewPolicy implements ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size = 10): ReviewCandidate[] {
    if (cards.length === 0 || size <= 0) {
      return [];
    }

    const candidates = cards.map((card) => this.create_candidate(card));
    return this.select_weighted_candidates(candidates, size);
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
    return Math.max(0.001, base_weight + 1 / decay);
  }

  private create_candidate(card: CardEntity): ReviewCandidate {
    return {
      ...card,
      svg_source: render_card_svg({
        word: card.word,
        reading: card.reading,
        context: card.context,
        scene: card.scene,
        example: card.example,
        memory_level: card.memory_level,
      }),
      weight: this.calculate_weight(card),
    };
  }

  private select_weighted_candidates(candidates: ReviewCandidate[], size: number): ReviewCandidate[] {
    const pool = [...candidates];
    const selection: ReviewCandidate[] = [];

    while (pool.length > 0 && selection.length < size) {
      const total_weight = pool.reduce((sum, candidate) => sum + candidate.weight, 0);
      if (total_weight <= 0) {
        selection.push(...pool.splice(0, size - selection.length));
        break;
      }

      const target = Math.random() * total_weight;
      let accumulated = 0;
      let chosen_index = 0;

      for (let index = 0; index < pool.length; index += 1) {
        accumulated += pool[index].weight;
        if (target <= accumulated) {
          chosen_index = index;
          break;
        }
      }

      const [chosen] = pool.splice(chosen_index, 1);
      selection.push(chosen);
    }

    return selection;
  }
}
