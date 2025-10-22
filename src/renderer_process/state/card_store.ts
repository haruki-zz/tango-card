import type { CardEntity } from '../../domain/card/card_entity';

export interface CardStoreState {
  readonly cards: CardEntity[];
  readonly is_loading: boolean;
  readonly error_message?: string;
}

type CardStoreListener = (state: CardStoreState) => void;

const INITIAL_STATE: CardStoreState = {
  cards: [],
  is_loading: false,
  error_message: undefined,
};

export class CardStore {
  private state: CardStoreState = INITIAL_STATE;
  private readonly listeners = new Set<CardStoreListener>();

  subscribe(listener: CardStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  get_state(): CardStoreState {
    return this.state;
  }

  set_loading(is_loading: boolean): void {
    this.update_state({ ...this.state, is_loading, error_message: undefined });
  }

  set_cards(cards: CardEntity[]): void {
    this.update_state({ ...this.state, cards, is_loading: false, error_message: undefined });
  }

  set_error(message: string): void {
    this.update_state({ ...this.state, is_loading: false, error_message: message });
  }

  private update_state(next_state: CardStoreState): void {
    this.state = next_state;
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const card_store = new CardStore();
