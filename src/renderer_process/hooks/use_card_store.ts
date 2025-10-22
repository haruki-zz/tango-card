import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { RendererApi } from '../../preload/context_bridge';
import { card_store } from '../state/card_store';

function get_renderer_api(): RendererApi {
  if (typeof window === 'undefined' || !window.tango_api) {
    throw new Error('Renderer API is unavailable in this environment.');
  }
  return window.tango_api;
}

function useCardStore() {
  const state = useSyncExternalStore(
    (listener) => card_store.subscribe(listener),
    () => card_store.get_state(),
  );

  const refresh_cards = useCallback(async () => {
    try {
      card_store.set_loading(true);
      const cards = await get_renderer_api().list_cards();
      card_store.set_cards(cards);
    } catch (error) {
      card_store.set_error((error as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh_cards().catch(() => {
      card_store.set_error('Failed to load cards.');
    });
  }, [refresh_cards]);

  return {
    ...state,
    refresh_cards,
  };
}

export const use_card_store = useCardStore;
