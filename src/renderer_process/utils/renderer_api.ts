import type {
  CardIngestRequest,
  RendererApi,
  ReviewQueueRequest,
  ReviewUpdateRequest,
} from '../../shared/ipc/contracts';
import type { CardEntity } from '../../domain/card/card_entity';
import { SimpleReviewPolicy } from '../../domain/review/review_policy';
import { create_card, update_card } from '../../domain/card/card_factory';
import { create_domain_error } from '../../shared/errors/domain_error';

declare global {
  interface Window {
    tango_api?: RendererApi;
  }
}

const review_policy = new SimpleReviewPolicy();
const in_memory_cards: Map<string, CardEntity> = new Map();

function clone_card(card: CardEntity): CardEntity {
  return { ...card };
}

const fallback_api: RendererApi = {
  async ingest_card(payload: CardIngestRequest) {
    const created_at = payload.created_at ?? new Date().toISOString();

    if (payload.card_id && in_memory_cards.has(payload.card_id)) {
      const existing = in_memory_cards.get(payload.card_id)!;
      const update_result = update_card(existing, {
        word: payload.word,
        reading: payload.reading,
        context: payload.context,
        scene: payload.scene,
        example: payload.example,
        created_at,
      });
      if (!update_result.ok) {
        throw update_result.error;
      }
      const updated_card = update_result.data;
      const duplicate = Array.from(in_memory_cards.values()).find(
        (card) => card.word.trim() === updated_card.word.trim() && card.id !== updated_card.id,
      );
      if (duplicate) {
        throw create_domain_error(
          'card.duplicate_word',
          `The word "${updated_card.word}" already exists in your collection.`,
        );
      }
      in_memory_cards.set(updated_card.id, updated_card);
      return clone_card(updated_card);
    }

    const normalized_word = payload.word.trim();
    const duplicate = Array.from(in_memory_cards.values()).find(
      (card) => card.word.trim() === normalized_word,
    );
    if (duplicate) {
      throw create_domain_error(
        'card.duplicate_word',
        `The word "${normalized_word}" already exists in your collection.`,
      );
    }

    const create_result = create_card({
      word: payload.word,
      reading: payload.reading,
      context: payload.context,
      scene: payload.scene,
      example: payload.example,
      created_at,
    });

    if (!create_result.ok) {
      throw create_result.error;
    }

    const new_card = create_result.data;
    in_memory_cards.set(new_card.id, new_card);
    return clone_card(new_card);
  },

  async list_cards() {
    return Array.from(in_memory_cards.values()).map(clone_card);
  },

  async fetch_review_queue(request?: ReviewQueueRequest) {
    const cards = Array.from(in_memory_cards.values());
    return review_policy.generate_review_queue(cards, request?.size);
  },

  async update_review(payload: ReviewUpdateRequest) {
    const card = in_memory_cards.get(payload.card_id);
    if (!card) {
      throw new Error(`Card ${payload.card_id} not found.`);
    }

    const updated = review_policy.mark_reviewed(card);
    in_memory_cards.set(payload.card_id, updated);

    return clone_card(updated);
  },
};

export function reset_renderer_api_mock(): void {
  in_memory_cards.clear();
}

export function get_renderer_api(): RendererApi {
  if (typeof window !== 'undefined' && window.tango_api) {
    return window.tango_api;
  }

  if (typeof console !== 'undefined') {
    console.warn(
      'Renderer API bridge is unavailable; falling back to in-memory mock for browser preview.',
    );
  }

  return fallback_api;
}
