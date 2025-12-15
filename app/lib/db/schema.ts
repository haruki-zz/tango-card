import {
  DEFAULT_FAMILIARITY,
  DEFAULT_REVIEW_COUNT,
  FAMILIARITY_VALUES,
  REVIEW_RESULT_VALUES,
} from "../constants";
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from "./syncQueue/constants";

const familiarityChoices = FAMILIARITY_VALUES.map((value) => `'${value}'`).join(", ");
const reviewResultChoices = REVIEW_RESULT_VALUES.map((value) => `'${value}'`).join(", ");
const syncEntityChoices = SYNC_ENTITY_TYPES.map((value) => `'${value}'`).join(", ");
const syncOperationChoices = SYNC_OPERATIONS.map((value) => `'${value}'`).join(", ");

export const enableForeignKeysPragma = "PRAGMA foreign_keys = ON;";

const createWordEntriesTable = `
CREATE TABLE IF NOT EXISTS word_entries (
  id TEXT PRIMARY KEY NOT NULL,
  surface TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning_zh TEXT NOT NULL,
  example_ja TEXT NOT NULL,
  familiarity TEXT NOT NULL DEFAULT '${DEFAULT_FAMILIARITY}' CHECK (familiarity IN (${familiarityChoices})),
  review_count INTEGER NOT NULL DEFAULT ${DEFAULT_REVIEW_COUNT} CHECK (review_count >= 0),
  last_reviewed_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  ai_model TEXT,
  ai_prompt_hash TEXT
);
`;

const createReviewEventsTable = `
CREATE TABLE IF NOT EXISTS review_events (
  id TEXT PRIMARY KEY NOT NULL,
  word_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN (${reviewResultChoices})),
  timestamp TEXT NOT NULL,
  FOREIGN KEY (word_id) REFERENCES word_entries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_events_word_id ON review_events(word_id);
`;

const createActivityLogTable = `
CREATE TABLE IF NOT EXISTS activity_log (
  date TEXT PRIMARY KEY NOT NULL,
  add_count INTEGER NOT NULL DEFAULT 0 CHECK (add_count >= 0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0)
);
`;

const createSyncQueueTable = `
CREATE TABLE IF NOT EXISTS sync_queue (
  queue_id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (${syncEntityChoices})),
  operation TEXT NOT NULL CHECK (operation IN (${syncOperationChoices})),
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  next_attempt_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_next_attempt ON sync_queue(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
`;

export const schemaSql = `
${createWordEntriesTable}
${createReviewEventsTable}
${createActivityLogTable}
${createSyncQueueTable}
`;
