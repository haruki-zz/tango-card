import { useCallback, useMemo } from 'react';
import type { MemoryLevel } from '../../domain/review/memory_level';
import { review_queue_store } from '../state/review_queue_store';
import { get_renderer_api } from '../utils/renderer_api';
import { MEMORY_LEVEL_WEIGHTS } from '../../domain/review/memory_level';

function useReviewCycle() {
  const queue = review_queue_store((state) => state.queue);
  const active_index = review_queue_store((state) => state.active_index);
  const set_queue = review_queue_store((state) => state.set_queue);
  const advance = review_queue_store((state) => state.advance);
  const update_card = review_queue_store((state) => state.update_card);

  const start_round = useCallback(async (size?: number) => {
    const api = get_renderer_api();
    const queue = await api.fetch_review_queue(size ? { size } : undefined);
    set_queue(queue);
  }, [set_queue]);

  const submit_review = useCallback(async (card_id: string, memory_level: MemoryLevel) => {
    const api = get_renderer_api();
    const updated_card = await api.update_review({ card_id, memory_level });
    update_card(card_id, (existing) => ({
      ...existing,
      memory_level: updated_card.memory_level,
      review_count: updated_card.review_count ?? existing.review_count,
      last_reviewed_at: updated_card.last_reviewed_at ?? existing.last_reviewed_at,
      weight: MEMORY_LEVEL_WEIGHTS[updated_card.memory_level] ?? existing.weight,
    }));
    advance();
  }, [advance, update_card]);

  const active_card = useMemo(() => queue[active_index], [active_index, queue]);

  return {
    queue,
    active_index,
    active_card,
    start_round,
    submit_review,
  };
}

export const use_review_cycle = useReviewCycle;
