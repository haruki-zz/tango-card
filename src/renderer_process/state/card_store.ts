import { create } from 'zustand';
import type { CardEntity } from '../../domain/card/card_entity';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ACTIVITY_WINDOW_DAYS = 84;

export interface DailyActivityPoint {
  readonly date: string;
  readonly created_count: number;
  readonly reviewed_count: number;
}

export interface CardStoreState {
  readonly cards: CardEntity[];
  readonly is_loading: boolean;
  readonly error_message?: string;
  readonly daily_activity: DailyActivityPoint[];
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
  daily_activity: [],
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
      daily_activity: compute_daily_activity(cards),
    }),
  set_error: (message: string) =>
    set((state) => ({
      ...state,
      is_loading: false,
      error_message: message,
    })),
  reset: () => set(INITIAL_STATE),
}));

function compute_daily_activity(cards: CardEntity[], window_days = DEFAULT_ACTIVITY_WINDOW_DAYS): DailyActivityPoint[] {
  const normalized_days = Math.max(1, window_days);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const activity_map = new Map<string, DailyActivityPoint>();

  for (let offset = normalized_days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * DAY_IN_MS);
    const key = format_date(day);
    activity_map.set(key, {
      date: key,
      created_count: 0,
      reviewed_count: 0,
    });
  }

  cards.forEach((card) => {
    const created_key = extract_date(card.created_at);
    if (created_key && activity_map.has(created_key)) {
      const point = activity_map.get(created_key);
      if (point) {
        point.created_count += 1;
      }
    }
    if (card.last_reviewed_at) {
      const reviewed_key = extract_date(card.last_reviewed_at);
      if (reviewed_key && activity_map.has(reviewed_key)) {
        const point = activity_map.get(reviewed_key);
        if (point) {
          point.reviewed_count += 1;
        }
      }
    }
  });

  return Array.from(activity_map.values());
}

function extract_date(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return format_date(parsed);
}

function format_date(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
