import { buildReviewEvent, ReviewEvent, ReviewEventDraft } from "../types";
import { DatabaseConnection } from "./database";
import { mapReviewEventRow, ReviewEventRow } from "./mappers";

const insertReviewEventSql = `
INSERT INTO review_events (
  id,
  word_id,
  result,
  timestamp
) VALUES (?, ?, ?, ?);
`;

export const insertReviewEvent = async (
  db: DatabaseConnection,
  draft: ReviewEventDraft,
  timestamp = new Date().toISOString(),
): Promise<ReviewEvent> => {
  const event = buildReviewEvent(draft, timestamp);

  await db.runAsync(insertReviewEventSql, [
    event.id,
    event.wordId,
    event.result,
    event.timestamp,
  ]);

  return event;
};

export const listReviewEventsByWord = async (
  db: DatabaseConnection,
  wordId: string,
): Promise<ReviewEvent[]> => {
  const rows = await db.getAllAsync<ReviewEventRow>(
    "SELECT * FROM review_events WHERE word_id = ? ORDER BY timestamp DESC;",
    wordId,
  );
  return rows.map(mapReviewEventRow);
};

export const deleteReviewEventById = async (
  db: DatabaseConnection,
  id: string,
): Promise<boolean> => {
  const result = await db.runAsync("DELETE FROM review_events WHERE id = ?;", id);
  return result.changes > 0;
};
