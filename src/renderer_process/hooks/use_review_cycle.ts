import { useCallback, useMemo } from 'react';
import { review_queue_store } from '../state/review_queue_store';
import { get_renderer_api } from '../utils/renderer_api';
import type { Familiarity } from '../../domain/card/card_entity';
import { card_store } from '../state/card_store';

function useReviewCycle() {
  const queue = review_queue_store((state) => state.queue);
  const active_index = review_queue_store((state) => state.active_index);
  const reviewed_ids = review_queue_store((state) => state.reviewed_ids);
  const set_queue = review_queue_store((state) => state.set_queue);
  const move = review_queue_store((state) => state.move);
  const reset_queue = review_queue_store((state) => state.reset);
  const update_card = review_queue_store((state) => state.update_card);
  const mark_reviewed = review_queue_store((state) => state.mark_reviewed);

  const start_round = useCallback(async (size?: number) => {
    const api = get_renderer_api();
    const queue = await api.fetch_review_queue(size ? { size } : undefined);
    set_queue(queue);
  }, [set_queue]);

  const submit_review = useCallback(async (card_id: string) => {
    if (reviewed_ids.includes(card_id)) {
      return;
    }
    const api = get_renderer_api();
    const updated_card = await api.update_review({ card_id });
    update_card(card_id, (existing) => ({
      ...existing,
      review_count: updated_card.review_count ?? existing.review_count,
      last_reviewed_at: updated_card.last_reviewed_at ?? existing.last_reviewed_at,
    }));
    mark_reviewed(card_id);
    card_store.getState().increment_reviewed(new Date().toISOString().slice(0, 10));
  }, [mark_reviewed, reviewed_ids, update_card]);

  const update_familiarity = useCallback(async (card_id: string, familiarity: Familiarity) => {
    const api = get_renderer_api();
    const updated_card = await api.update_familiarity({ card_id, familiarity });
    update_card(card_id, (existing) => ({
      ...existing,
      familiarity: updated_card.familiarity,
    }));
  }, [update_card]);

  const active_card = useMemo(() => queue[active_index], [active_index, queue]);

  const move_next = useCallback(() => {
    move('next');
  }, [move]);

  const move_previous = useCallback(() => {
    move('previous');
  }, [move]);

  return {
    queue,
    active_index,
    active_card,
    reviewed_ids,
    start_round,
    reset_queue,
    submit_review,
    update_familiarity,
    move_next,
    move_previous,
  };
}

export const use_review_cycle = useReviewCycle;
