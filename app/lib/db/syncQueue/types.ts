import { ReviewEvent, WordEntry } from "../../types";
import { SYNC_ENTITY_TYPES, SYNC_OPERATIONS } from "./constants";

export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number];
export type SyncOperation = (typeof SYNC_OPERATIONS)[number];

export type SyncPayload = WordEntry | ReviewEvent;

export interface SyncQueueRow {
  queue_id: string;
  entity_type: SyncEntityType;
  operation: SyncOperation;
  entity_id: string;
  payload: string;
  client_updated_at: string;
  attempt: number;
  next_attempt_at: string;
  last_error: string | null;
}

export interface SyncQueueItem {
  id: string;
  entityId: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  payload: SyncPayload;
  clientUpdatedAt: string;
  attempt: number;
  nextAttemptAt: string;
  lastError?: string | null;
}
