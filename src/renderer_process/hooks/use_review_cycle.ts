import { useCallback, useSyncExternalStore } from 'react';
import type { RendererApi } from '../../preload/context_bridge';
import type { MemoryLevel } from '../../domain/review/memory_level';
import { review_queue_store } from '../state/review_queue_store';

function get_renderer_api(): RendererApi {
  if (typeof window === 'undefined' || !window.tango_api) {
    throw new Error('Renderer API is unavailable in this environment.');
  }
  return window.tango_api;
}

function useReviewCycle() {
  const state = useSyncExternalStore(
    (listener) => review_queue_store.subscribe(listener),
    () => review_queue_store.get_state(),
  );

  const load_queue = useCallback(async (size?: number) => {
    const api = get_renderer_api();
    const queue = await api.fetch_review_queue(size);
    review_queue_store.set_queue(queue);
  }, []);

  const submit_review = useCallback(async (card_id: string, memory_level: MemoryLevel) => {
    const api = get_renderer_api();
    await api.update_review(card_id, memory_level);
    review_queue_store.advance();
  }, []);

  const reset_queue = useCallback(() => {
    review_queue_store.reset();
  }, []);

  return {
    ...state,
    active_card: state.queue[state.active_index],
    load_queue,
    submit_review,
    reset_queue,
  };
}

export const use_review_cycle = useReviewCycle;
