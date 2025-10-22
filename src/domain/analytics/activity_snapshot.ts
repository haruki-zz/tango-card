export interface DailyActivityPoint {
  readonly date: string;
  readonly created_cards: number;
  readonly reviewed_cards: number;
}

export interface ActivitySnapshot {
  readonly streak_days: number;
  readonly total_cards: number;
  readonly total_reviews: number;
  readonly points: DailyActivityPoint[];
}

export const EMPTY_ACTIVITY_SNAPSHOT: ActivitySnapshot = {
  streak_days: 0,
  total_cards: 0,
  total_reviews: 0,
  points: [],
};
