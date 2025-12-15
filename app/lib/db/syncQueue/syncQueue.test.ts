/** @jest-environment node */

import {
  clearDatabase,
  enqueueReviewEventForSync,
  enqueueWordForSync,
  listAllSyncQueueItems,
  listDueSyncQueueItems,
  markSyncSuccess,
  openDatabase,
  recordSyncFailure,
  resolveSyncConflict,
} from "@/app/lib/db";
import { buildReviewEvent, buildWordEntry, ReviewEvent, WordEntry } from "@/app/lib/types";

jest.mock("expo-sqlite");

const createWord = (overrides?: Partial<WordEntry>) =>
  buildWordEntry({
    id: overrides?.id ?? "word-1",
    surface: overrides?.surface ?? "単語",
    reading: overrides?.reading ?? "たんご",
    meaningZh: overrides?.meaningZh ?? "单词",
    exampleJa: overrides?.exampleJa ?? "例句",
    createdAt: overrides?.createdAt ?? "2024-05-01T00:00:00.000Z",
    updatedAt: overrides?.updatedAt ?? "2024-05-01T00:00:00.000Z",
    lastReviewedAt: overrides?.lastReviewedAt ?? overrides?.updatedAt,
    reviewCount: overrides?.reviewCount,
    familiarity: overrides?.familiarity,
    aiMeta: overrides?.aiMeta,
  });

const createReviewEvent = (overrides?: Partial<ReviewEvent>) =>
  buildReviewEvent({
    id: overrides?.id ?? "review-1",
    wordId: overrides?.wordId ?? "word-1",
    result: overrides?.result ?? "familiar",
    timestamp: overrides?.timestamp ?? "2024-05-03T00:00:00.000Z",
  });

describe("同步队列", () => {
  it("同一词多次编辑仅保留最新版本，并在失败后按退避重试", async () => {
    const db = await openDatabase(":memory:");

    const first = createWord();
    const latest = createWord({
      meaningZh: "词汇",
      updatedAt: "2024-05-02T00:00:00.000Z",
      lastReviewedAt: "2024-05-02T00:00:00.000Z",
    });

    await enqueueWordForSync(db, first, new Date(first.updatedAt));
    const queued = await enqueueWordForSync(db, latest, new Date(latest.updatedAt));

    const due = await listDueSyncQueueItems(db, new Date(latest.updatedAt));
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(queued.id);
    expect(due[0].payload).toMatchObject({ meaningZh: "词汇" });
    expect(due[0].clientUpdatedAt).toBe(latest.updatedAt);
    expect(due[0].attempt).toBe(0);

    const failedAt = new Date("2024-05-03T00:00:00.000Z");
    const afterFailure = await recordSyncFailure(db, queued.id, "network down", failedAt);
    expect(afterFailure?.attempt).toBe(1);
    expect(afterFailure?.nextAttemptAt).toBe(
      new Date(failedAt.getTime() + 1000).toISOString(),
    );
    expect(afterFailure?.lastError).toBe("network down");

    const secondFailedAt = new Date("2024-05-03T00:00:01.000Z");
    const afterSecondFailure = await recordSyncFailure(
      db,
      queued.id,
      "still offline",
      secondFailedAt,
    );
    expect(afterSecondFailure?.attempt).toBe(2);
    expect(afterSecondFailure?.nextAttemptAt).toBe(
      new Date(secondFailedAt.getTime() + 2000).toISOString(),
    );

    const conflictResult = await resolveSyncConflict(
      db,
      queued.id,
      "2024-05-10T00:00:00.000Z",
    );
    expect(conflictResult).toBe("server_wins");

    const remaining = await listAllSyncQueueItems(db);
    expect(remaining).toHaveLength(0);

    await clearDatabase(db);
    await db.closeAsync();
  });

  it("复习事件入队并在服务端时间较旧时保留本地更新重试", async () => {
    const db = await openDatabase(":memory:");
    const word = createWord({
      id: "word-2",
      updatedAt: "2024-05-04T00:00:00.000Z",
      createdAt: "2024-05-04T00:00:00.000Z",
    });
    const reviewEvent = createReviewEvent({
      id: "review-2",
      wordId: word.id,
      timestamp: "2024-05-04T12:00:00.000Z",
    });

    const queuedWord = await enqueueWordForSync(db, word, new Date(word.updatedAt));
    const queuedReview = await enqueueReviewEventForSync(
      db,
      reviewEvent,
      new Date(reviewEvent.timestamp),
    );

    const due = await listDueSyncQueueItems(db, new Date("2024-05-05T00:00:00.000Z"));
    expect(due).toHaveLength(2);
    const reviewItem = due.find((item) => item.id === queuedReview.id);
    expect(reviewItem?.entityType).toBe("review_event");
    expect(reviewItem?.payload).toMatchObject({ wordId: word.id, id: reviewEvent.id });

    const decision = await resolveSyncConflict(
      db,
      queuedWord.id,
      "2024-05-01T00:00:00.000Z",
      new Date("2024-05-05T01:00:00.000Z"),
    );
    expect(decision).toBe("retry");

    const afterConflict = await listAllSyncQueueItems(db);
    const retainedWord = afterConflict.find((item) => item.id === queuedWord.id);
    expect(retainedWord?.nextAttemptAt).toBe("2024-05-05T01:00:00.000Z");
    expect(retainedWord?.attempt).toBe(0);

    const removed = await markSyncSuccess(db, queuedReview.id);
    expect(removed).toBe(true);

    const remaining = await listAllSyncQueueItems(db);
    expect(remaining.find((item) => item.id === queuedReview.id)).toBeUndefined();

    await clearDatabase(db);
    await db.closeAsync();
  });
});
