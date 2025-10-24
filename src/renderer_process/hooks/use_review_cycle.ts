import { useCallback, useMemo } from 'react';
import type { MemoryLevel } from '../../domain/review/memory_level';
import { review_queue_store } from '../state/review_queue_store';
import { get_renderer_api } from '../utils/renderer_api';

function useReviewCycle() {
  const queue = review_queue_store((state) => state.queue);
  const active_index = review_queue_store((state) => state.active_index);
  const set_queue = review_queue_store((state) => state.set_queue);
  const advance = review_queue_store((state) => state.advance);
  const reset = review_queue_store((state) => state.reset);

  const load_queue = useCallback(async (size?: number) => {
    const api = get_renderer_api();
    const queue = await api.fetch_review_queue(size ? { size } : undefined);
    set_queue(queue);
  }, [set_queue]);

  const submit_review = useCallback(async (card_id: string, memory_level: MemoryLevel) => {
    const api = get_renderer_api();
    await api.update_review({ card_id, memory_level });
    advance();
  }, [advance]);

  const reset_queue = useCallback(() => {
    reset();
  }, [reset]);

  const active_card = useMemo(() => queue[active_index], [active_index, queue]);

  return {
    queue,
    active_index,
    active_card,
    load_queue,
    submit_review,
    reset_queue,
  };
}

export const use_review_cycle = useReviewCycle;
