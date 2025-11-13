import type { CardEntity } from '../card/card_entity';
import { render_card_svg } from '../../shared/templates/card_svg_template';

export interface ReviewCandidate extends CardEntity {
  readonly svg_source: string;
}

export interface ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size?: number): ReviewCandidate[];
  mark_reviewed(card: CardEntity): CardEntity;
}

export class SimpleReviewPolicy implements ReviewPolicy {
  generate_review_queue(cards: CardEntity[], size = 10): ReviewCandidate[] {
    if (cards.length === 0 || size <= 0) {
      return [];
    }
    const selection = shuffle([...cards]).slice(0, Math.min(size, cards.length));
    return selection.map(create_candidate);
  }

  mark_reviewed(card: CardEntity): CardEntity {
    return {
      ...card,
      review_count: card.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    };
  }
}

function create_candidate(card: CardEntity): ReviewCandidate {
  return {
    ...card,
    svg_source: render_card_svg({
      word: card.word,
      reading: card.reading,
      context: card.context,
      scene: card.scene,
      example: card.example,
    }),
  };
}

function shuffle<T>(source: T[], random: () => number = Math.random): T[] {
  const array = [...source];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swap_index = Math.floor(random() * (index + 1));
    [array[index], array[swap_index]] = [array[swap_index], array[index]];
  }
  return array;
}
