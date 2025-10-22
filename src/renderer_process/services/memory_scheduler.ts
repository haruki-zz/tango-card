import type { CardEntity } from '../../domain/card/card_entity';
import { WeightedMemoryReviewPolicy } from '../../domain/review/review_policy';

const review_policy = new WeightedMemoryReviewPolicy();

export function build_weighted_queue(cards: CardEntity[], size?: number) {
  return review_policy.generate_review_queue(cards, size);
}
