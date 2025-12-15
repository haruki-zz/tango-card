export const SYNC_ENTITY_TYPES = ["word", "review_event"] as const;

export const SYNC_OPERATIONS = ["upsert"] as const;

export const SYNC_RETRY_BASE_DELAY_MS = 1000;
export const SYNC_RETRY_MAX_DELAY_MS = 1000 * 60 * 5;
