import {
  ActivityLog,
  ActivityLogDraft,
  buildActivityLog,
} from "../types";
import { DatabaseConnection } from "./database";
import { mapActivityLogRow, ActivityLogRow } from "./mappers";

const upsertActivityLogSql = `
INSERT INTO activity_log (
  date,
  add_count,
  review_count
) VALUES (?, ?, ?)
ON CONFLICT(date) DO UPDATE SET
  add_count = excluded.add_count,
  review_count = excluded.review_count;
`;

const incrementActivityLogSql = `
INSERT INTO activity_log (
  date,
  add_count,
  review_count
) VALUES (?, ?, ?)
ON CONFLICT(date) DO UPDATE SET
  add_count = activity_log.add_count + excluded.add_count,
  review_count = activity_log.review_count + excluded.review_count;
`;

export const upsertActivityLog = async (
  db: DatabaseConnection,
  draft: ActivityLogDraft,
): Promise<ActivityLog> => {
  const log = buildActivityLog(draft);

  await db.runAsync(upsertActivityLogSql, [
    log.date,
    log.addCount,
    log.reviewCount,
  ]);

  return log;
};

export const incrementActivityLog = async (
  db: DatabaseConnection,
  date: string,
  deltas: { addDelta?: number; reviewDelta?: number },
): Promise<ActivityLog> => {
  const addDelta = deltas.addDelta ?? 0;
  const reviewDelta = deltas.reviewDelta ?? 0;

  await db.runAsync(incrementActivityLogSql, [date, addDelta, reviewDelta]);

  const updated = await getActivityLogByDate(db, date);
  if (!updated) {
    throw new Error("活动日志未找到");
  }
  return updated;
};

export const getActivityLogByDate = async (
  db: DatabaseConnection,
  date: string,
): Promise<ActivityLog | null> => {
  const row = await db.getFirstAsync<ActivityLogRow>(
    "SELECT * FROM activity_log WHERE date = ?;",
    date,
  );
  return row ? mapActivityLogRow(row) : null;
};

export const listActivityLogs = async (
  db: DatabaseConnection,
): Promise<ActivityLog[]> => {
  const rows = await db.getAllAsync<ActivityLogRow>(
    "SELECT * FROM activity_log ORDER BY date DESC;",
  );
  return rows.map(mapActivityLogRow);
};

export const deleteActivityLogByDate = async (
  db: DatabaseConnection,
  date: string,
): Promise<boolean> => {
  const result = await db.runAsync("DELETE FROM activity_log WHERE date = ?;", date);
  return result.changes > 0;
};
