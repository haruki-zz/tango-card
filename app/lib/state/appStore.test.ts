import {
  DEFAULT_FAMILIARITY,
  DEFAULT_REVIEW_COUNT,
} from "../constants";
import { WordEntry } from "../types";
import { createAppStore } from "./appStore";

const fixedTimestamp = "2024-01-01T00:00:00.000Z";

const buildWord = (
  id: string,
  overrides: Partial<WordEntry> = {},
): WordEntry => ({
  id,
  surface: `surface-${id}`,
  reading: `reading-${id}`,
  meaningZh: `meaning-${id}`,
  exampleJa: `example-${id}`,
  familiarity: DEFAULT_FAMILIARITY,
  reviewCount: DEFAULT_REVIEW_COUNT,
  lastReviewedAt: fixedTimestamp,
  createdAt: fixedTimestamp,
  updatedAt: fixedTimestamp,
  ...overrides,
});

describe("appStore words", () => {
  it("supports create/update/delete flows for words", () => {
    const store = createAppStore();
    const first = buildWord("w1");
    const second = buildWord("w2");

    store.getState().setWords([first]);
    expect(store.getState().getWord(first.id)).toEqual(first);

    store.getState().upsertWord(second);
    expect(store.getState().listWords()).toHaveLength(2);

    store.getState().upsertWord({ ...second, meaningZh: "更新后的释义" });
    expect(store.getState().getWord(second.id)?.meaningZh).toBe("更新后的释义");

    store.getState().removeWord(first.id);
    expect(store.getState().getWord(first.id)).toBeUndefined();
    expect(store.getState().listWords()).toHaveLength(1);
  });
});

describe("appStore review queue", () => {
  it("enqueues, dedupes, pops, and purges missing words", () => {
    const store = createAppStore();
    const first = buildWord("a");
    const second = buildWord("b");
    const third = buildWord("c");

    store.getState().setWords([first, second, third]);

    store.getState().setReviewQueue([first.id, second.id, first.id]);
    expect(store.getState().reviewQueue).toEqual([first.id, second.id]);

    const next = store.getState().popNextReviewWord();
    expect(next?.id).toBe(first.id);
    expect(store.getState().reviewQueue).toEqual([second.id]);

    store.getState().enqueueReview([second.id, third.id]);
    expect(store.getState().reviewQueue).toEqual([second.id, third.id]);

    store.getState().removeWord(second.id);
    expect(store.getState().reviewQueue).toEqual([third.id]);

    store.getState().clearReviewQueue();
    expect(store.getState().reviewQueue).toEqual([]);
  });
});

describe("appStore activity log", () => {
  it("accumulates activity counts by date", () => {
    const store = createAppStore();

    store.getState().setActivityLogs([
      { date: "2024-01-01", addCount: 1, reviewCount: 2 },
    ]);

    const updated = store
      .getState()
      .incrementActivity("2024-01-01", { addDelta: 2 });
    expect(updated.addCount).toBe(3);
    expect(updated.reviewCount).toBe(2);

    const created = store
      .getState()
      .incrementActivity("2024-01-02", { reviewDelta: 1 });
    expect(created.addCount).toBe(0);
    expect(created.reviewCount).toBe(1);

    expect(store.getState().listActivityLogs()).toHaveLength(2);
    expect(store.getState().getActivityLog("2024-01-02")).toEqual(created);
  });
});
