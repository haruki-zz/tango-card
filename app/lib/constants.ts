export const FAMILIARITY_VALUES = ["familiar", "unfamiliar"] as const;

export const DEFAULT_FAMILIARITY = "familiar";
export const DEFAULT_REVIEW_COUNT = 1;
export const DEFAULT_REVIEW_BATCH_SIZE = 30;

export const REVIEW_RESULT_VALUES = FAMILIARITY_VALUES;
export const REVIEW_SELECTION_WEIGHT = {
  unfamiliar: 2,
  familiar: 1,
} as const;

export const HEATMAP_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 365;
export const HEATMAP_WEEK_START = 0; // 周日
export const ACTIVITY_LOG_BUCKET_TIMEZONE = "UTC";

export const SUPABASE_ENV_KEYS = {
  url: "EXPO_PUBLIC_SUPABASE_URL",
  anonKey: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
} as const;

export const AI_MODEL_KEYS = {
  gpt4o: "gpt-4o",
  gpt3_5: "gpt-3.5-turbo",
  geminiFlashLite: "gemini-2.5-flash-lite",
} as const;
