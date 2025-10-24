import { create } from 'zustand';
import type { CardEntity } from '../../domain/card/card_entity';

export interface CardStoreState {
  readonly cards: CardEntity[];
  readonly is_loading: boolean;
  readonly error_message?: string;
}

export interface CardStoreActions {
  set_loading(is_loading: boolean): void;
  set_cards(cards: CardEntity[]): void;
  set_error(message: string): void;
  reset(): void;
}

export type CardStore = CardStoreState & CardStoreActions;

const INITIAL_STATE: CardStoreState = {
  cards: [],
  is_loading: false,
  error_message: undefined,
};

export const card_store = create<CardStore>((set) => ({
  ...INITIAL_STATE,
  set_loading: (is_loading: boolean) =>
    set((state) => ({
      ...state,
      is_loading,
      error_message: undefined,
    })),
  set_cards: (cards: CardEntity[]) =>
    set({
      cards,
      is_loading: false,
      error_message: undefined,
    }),
  set_error: (message: string) =>
    set((state) => ({
      ...state,
      is_loading: false,
      error_message: message,
    })),
  reset: () => set(INITIAL_STATE),
}));
