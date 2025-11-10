export const APP_CHANNELS = {
  CARD_INGEST: 'card:ingest',
  CARD_LIST: 'card:list',
  REVIEW_QUEUE: 'review:queue',
  REVIEW_UPDATE: 'review:update',
} as const;

export type AppChannel = (typeof APP_CHANNELS)[keyof typeof APP_CHANNELS];
