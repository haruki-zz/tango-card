/** @jest-environment node */

import { DEFAULT_FAMILIARITY, DEFAULT_REVIEW_COUNT } from "@/app/lib/constants";
import {
  clearDatabase,
  deleteActivityLogByDate,
  deleteWordById,
  getActivityLogByDate,
  insertReviewEvent,
  insertWord,
  listActivityLogs,
  listReviewEventsByWord,
  listWords,
  openDatabase,
  updateWord,
  upsertActivityLog,
  incrementActivityLog,
} from "@/app/lib/db";
import { Familiarity } from "@/app/lib/types";

jest.mock("expo-sqlite");

describe("SQLite 持久化层", () => {
  const now = "2024-05-01T00:00:00.000Z";

  const baseWord = {
    id: "word-1",
    surface: "単語",
    reading: "たんご",
    meaningZh: "单词",
    exampleJa: "例句",
  };

  it("插入并更新单词时应用默认值与时间戳", async () => {
    const db = await openDatabase(":memory:");

    const created = await insertWord(db, baseWord, now);
    expect(created.familiarity).toBe(DEFAULT_FAMILIARITY);
    expect(created.reviewCount).toBe(DEFAULT_REVIEW_COUNT);
    expect(created.lastReviewedAt).toBe(created.createdAt);

    const updatedAt = "2024-05-02T00:00:00.000Z";
    const updated = await updateWord(
      db,
      {
        id: created.id,
        familiarity: "unfamiliar" as Familiarity,
        reviewCount: created.reviewCount + 1,
        lastReviewedAt: updatedAt,
      },
      updatedAt,
    );

    expect(updated.familiarity).toBe("unfamiliar");
    expect(updated.reviewCount).toBe(created.reviewCount + 1);
    expect(updated.updatedAt).toBe(updatedAt);
    expect(updated.lastReviewedAt).toBe(updatedAt);

    const words = await listWords(db);
    expect(words).toHaveLength(1);
    expect(words[0].id).toBe(created.id);

    await db.closeAsync();
  });

  it("写入复习事件并在删除单词后级联清理", async () => {
    const db = await openDatabase(":memory:");
    const word = await insertWord(db, baseWord, now);

    const eventTimestamp = "2024-05-03T00:00:00.000Z";
    await insertReviewEvent(
      db,
      { id: "review-1", wordId: word.id, result: DEFAULT_FAMILIARITY },
      eventTimestamp,
    );

    const events = await listReviewEventsByWord(db, word.id);
    expect(events).toHaveLength(1);
    expect(events[0].timestamp).toBe(eventTimestamp);

    await deleteWordById(db, word.id);

    const eventsAfterDelete = await listReviewEventsByWord(db, word.id);
    expect(eventsAfterDelete).toHaveLength(0);

    await db.closeAsync();
  });

  it("覆盖与累加每日活跃度", async () => {
    const db = await openDatabase(":memory:");
    const targetDate = "2024-05-04";

    const initial = await upsertActivityLog(db, { date: targetDate, addCount: 1 });
    expect(initial.addCount).toBe(1);
    expect(initial.reviewCount).toBe(0);

    const afterIncrement = await incrementActivityLog(db, targetDate, {
      addDelta: 2,
      reviewDelta: 3,
    });
    expect(afterIncrement.addCount).toBe(3);
    expect(afterIncrement.reviewCount).toBe(3);

    const fetched = await getActivityLogByDate(db, targetDate);
    expect(fetched?.addCount).toBe(3);
    expect(fetched?.reviewCount).toBe(3);

    const logs = await listActivityLogs(db);
    expect(logs[0].date).toBe(targetDate);

    await deleteActivityLogByDate(db, targetDate);
    await clearDatabase(db);
    await db.closeAsync();
  });
});
