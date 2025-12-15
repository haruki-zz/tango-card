import {
  buildReviewEvent,
  buildWordEntry,
  ReviewEvent,
  WordEntry,
} from "../../types";
import { DatabaseConnection } from "../database";
import {
  SYNC_ENTITY_TYPES,
  SYNC_OPERATIONS,
  SYNC_RETRY_BASE_DELAY_MS,
  SYNC_RETRY_MAX_DELAY_MS,
} from "./constants";
import {
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
  SyncQueueRow,
} from "./types";

const assertIsoDate = (value: string, field: string) => {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} 需要有效的 ISO 时间字符串`);
  }
};

const buildQueueId = (entityType: SyncEntityType, entityId: string) =>
  `${entityType}:${entityId}`;

const parsePayload = (entityType: SyncEntityType, raw: string): WordEntry | ReviewEvent => {
  const parsed = JSON.parse(raw);
  return entityType === "word" ? buildWordEntry(parsed as WordEntry) : buildReviewEvent(parsed as ReviewEvent);
};

const mapRowToItem = (row: SyncQueueRow): SyncQueueItem => ({
  id: row.queue_id,
  entityId: row.entity_id,
  entityType: row.entity_type,
  operation: row.operation,
  payload: parsePayload(row.entity_type, row.payload),
  clientUpdatedAt: row.client_updated_at,
  attempt: Number(row.attempt),
  nextAttemptAt: row.next_attempt_at,
  lastError: row.last_error,
});

const getQueueItemById = async (
  db: DatabaseConnection,
  queueId: string,
): Promise<SyncQueueItem | null> => {
  const row = await db.getFirstAsync<SyncQueueRow>(
    "SELECT * FROM sync_queue WHERE queue_id = ?;",
    queueId,
  );
  return row ? mapRowToItem(row) : null;
};

const replaceQueueEntry = async (
  db: DatabaseConnection,
  params: {
    queueId: string;
    entityType: SyncEntityType;
    entityId: string;
    operation: SyncOperation;
    payload: string;
    clientUpdatedAt: string;
    nextAttemptAt: string;
  },
): Promise<SyncQueueItem> => {
  await db.runAsync(
    `
    INSERT INTO sync_queue (
      queue_id,
      entity_type,
      operation,
      entity_id,
      payload,
      client_updated_at,
      attempt,
      next_attempt_at,
      last_error
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL)
    ON CONFLICT(queue_id) DO UPDATE SET
      operation = excluded.operation,
      entity_id = excluded.entity_id,
      payload = excluded.payload,
      client_updated_at = excluded.client_updated_at,
      attempt = 0,
      next_attempt_at = excluded.next_attempt_at,
      last_error = NULL;
    `,
    [
      params.queueId,
      params.entityType,
      params.operation,
      params.entityId,
      params.payload,
      params.clientUpdatedAt,
      params.nextAttemptAt,
    ],
  );

  const updated = await getQueueItemById(db, params.queueId);
  if (!updated) {
    throw new Error("同步队列写入失败");
  }
  return updated;
};

const shouldReplaceExisting = (
  existing: SyncQueueItem | null,
  nextClientUpdatedAt: string,
) => {
  if (!existing) {
    return true;
  }
  return (
    new Date(nextClientUpdatedAt).getTime() >= new Date(existing.clientUpdatedAt).getTime()
  );
};

const calculateNextAttemptAt = (attempt: number, now: Date) => {
  const delayMs = Math.min(
    SYNC_RETRY_BASE_DELAY_MS * 2 ** Math.max(attempt - 1, 0),
    SYNC_RETRY_MAX_DELAY_MS,
  );
  const next = new Date(now.getTime() + delayMs);
  return next.toISOString();
};

export const enqueueWordForSync = async (
  db: DatabaseConnection,
  word: WordEntry,
  now = new Date(),
): Promise<SyncQueueItem> => {
  assertIsoDate(word.updatedAt, "updatedAt");
  const queueId = buildQueueId("word", word.id);
  const existing = await getQueueItemById(db, queueId);

  if (!shouldReplaceExisting(existing, word.updatedAt)) {
    return existing;
  }

  return replaceQueueEntry(db, {
    queueId,
    entityType: "word",
    entityId: word.id,
    operation: "upsert",
    payload: JSON.stringify(word),
    clientUpdatedAt: word.updatedAt,
    nextAttemptAt: now.toISOString(),
  });
};

export const enqueueReviewEventForSync = async (
  db: DatabaseConnection,
  event: ReviewEvent,
  now = new Date(),
): Promise<SyncQueueItem> => {
  assertIsoDate(event.timestamp, "timestamp");
  const queueId = buildQueueId("review_event", event.id);
  const existing = await getQueueItemById(db, queueId);

  if (!shouldReplaceExisting(existing, event.timestamp)) {
    return existing;
  }

  return replaceQueueEntry(db, {
    queueId,
    entityType: "review_event",
    entityId: event.id,
    operation: "upsert",
    payload: JSON.stringify(event),
    clientUpdatedAt: event.timestamp,
    nextAttemptAt: now.toISOString(),
  });
};

export const listDueSyncQueueItems = async (
  db: DatabaseConnection,
  now = new Date(),
): Promise<SyncQueueItem[]> => {
  const rows = await db.getAllAsync<SyncQueueRow>(
    "SELECT * FROM sync_queue WHERE next_attempt_at <= ? ORDER BY next_attempt_at ASC;",
    now.toISOString(),
  );
  return rows.map(mapRowToItem);
};

export const markSyncSuccess = async (
  db: DatabaseConnection,
  queueId: string,
): Promise<boolean> => {
  const result = await db.runAsync("DELETE FROM sync_queue WHERE queue_id = ?;", queueId);
  return result.changes > 0;
};

export const recordSyncFailure = async (
  db: DatabaseConnection,
  queueId: string,
  error: string,
  now = new Date(),
): Promise<SyncQueueItem | null> => {
  const existing = await getQueueItemById(db, queueId);
  if (!existing) {
    return null;
  }

  const nextAttempt = existing.attempt + 1;
  const nextAttemptAt = calculateNextAttemptAt(nextAttempt, now);

  await db.runAsync(
    `
    UPDATE sync_queue
    SET attempt = ?, next_attempt_at = ?, last_error = ?
    WHERE queue_id = ?;
    `,
    [nextAttempt, nextAttemptAt, error, queueId],
  );

  return getQueueItemById(db, queueId);
};

export const resolveSyncConflict = async (
  db: DatabaseConnection,
  queueId: string,
  serverUpdatedAt: string,
  now = new Date(),
): Promise<"server_wins" | "retry" | "missing"> => {
  assertIsoDate(serverUpdatedAt, "serverUpdatedAt");
  const existing = await getQueueItemById(db, queueId);
  if (!existing) {
    return "missing";
  }

  const serverIsNewer =
    new Date(serverUpdatedAt).getTime() >= new Date(existing.clientUpdatedAt).getTime();

  if (serverIsNewer) {
    await markSyncSuccess(db, queueId);
    return "server_wins";
  }

  await db.runAsync(
    `
    UPDATE sync_queue
    SET next_attempt_at = ?, last_error = NULL
    WHERE queue_id = ?;
    `,
    [now.toISOString(), queueId],
  );

  return "retry";
};

export const listAllSyncQueueItems = async (
  db: DatabaseConnection,
): Promise<SyncQueueItem[]> => {
  const rows = await db.getAllAsync<SyncQueueRow>(
    "SELECT * FROM sync_queue ORDER BY next_attempt_at ASC;",
  );
  return rows.map(mapRowToItem);
};

export const isValidSyncEntityType = (value: string): value is SyncEntityType =>
  (SYNC_ENTITY_TYPES as readonly string[]).includes(value);

export const isValidSyncOperation = (value: string): value is SyncOperation =>
  (SYNC_OPERATIONS as readonly string[]).includes(value);
