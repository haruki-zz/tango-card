import { useCallback, useEffect } from 'react';
import { card_store } from '../state/card_store';
import { get_renderer_api } from '../utils/renderer_api';

function useCardStore() {
  const cards = card_store((state) => state.cards);
  const is_loading = card_store((state) => state.is_loading);
  const error_message = card_store((state) => state.error_message);
  const set_loading = card_store((state) => state.set_loading);
  const set_cards = card_store((state) => state.set_cards);
  const set_error = card_store((state) => state.set_error);

  const refresh_cards = useCallback(async () => {
    try {
      set_loading(true);
      const cards = await get_renderer_api().list_cards();
      set_cards(cards);
    } catch (error) {
      set_error((error as Error).message);
    }
  }, [set_cards, set_error, set_loading]);

  useEffect(() => {
    refresh_cards().catch(() => {
      set_error('Failed to load cards.');
    });
  }, [refresh_cards, set_error]);

  return {
    cards,
    is_loading,
    error_message,
    refresh_cards,
  };
}

export const use_card_store = useCardStore;
