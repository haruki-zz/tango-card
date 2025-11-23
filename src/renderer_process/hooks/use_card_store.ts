import { useCallback, useEffect } from 'react';
import { card_store } from '../state/card_store';
import { get_renderer_api } from '../utils/renderer_api';

function useCardStore() {
  const cards = card_store((state) => state.cards);
  const is_loading = card_store((state) => state.is_loading);
  const error_message = card_store((state) => state.error_message);
  const daily_activity = card_store((state) => state.daily_activity);
  const activity_window_days = card_store((state) => state.activity_window_days);
  const set_loading = card_store((state) => state.set_loading);
  const set_cards = card_store((state) => state.set_cards);
  const set_error = card_store((state) => state.set_error);
  const set_activity_window = card_store((state) => state.set_activity_window);
  const increment_created = card_store((state) => state.increment_created);
  const increment_reviewed = card_store((state) => state.increment_reviewed);

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
    daily_activity,
    activity_window_days,
    refresh_cards,
    set_activity_window,
    increment_created,
    increment_reviewed,
  };
}

export const use_card_store = useCardStore;
