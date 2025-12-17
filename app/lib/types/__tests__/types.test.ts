import {
  DEFAULT_FAMILIARITY,
  DEFAULT_REVIEW_BATCH_SIZE,
  DEFAULT_REVIEW_COUNT,
} from "@/app/lib/constants";
import {
  buildActivityLog,
  buildReviewEvent,
  buildUser,
  buildWordEntry,
  Familiarity,
  ReviewResult,
} from "@/app/lib/types";

describe("buildWordEntry", () => {
  const baseDraft = {
    id: "word-1",
    surface: "単語",
    reading: "たんご",
    meaningZh: "单词",
    exampleJa: "例句",
  };

  it("applies defaults for familiarity, counts and timestamps", () => {
    const now = "2024-05-01T00:00:00.000Z";

    const entry = buildWordEntry(baseDraft, now);

    expect(entry.familiarity).toBe(DEFAULT_FAMILIARITY);
    expect(entry.reviewCount).toBe(DEFAULT_REVIEW_COUNT);
    expect(entry.createdAt).toBe(now);
    expect(entry.updatedAt).toBe(now);
    expect(entry.lastReviewedAt).toBe(now);
  });

  it("rejects familiarity outside allowlist", () => {
    const invalidDraft = {
      ...baseDraft,
      familiarity: "unknown" as Familiarity,
    };

    expect(() => buildWordEntry(invalidDraft)).toThrow("familiarity");
  });

  it("requires aiMeta.model when aiMeta is present", () => {
    const invalidDraft = {
      ...baseDraft,
      aiMeta: { model: "" },
    };

    expect(() => buildWordEntry(invalidDraft)).toThrow("aiMeta.model");
  });
});

describe("buildReviewEvent", () => {
  it("rejects result not in allowlist", () => {
    expect(() =>
      buildReviewEvent({
        id: "review-1",
        wordId: "word-1",
        result: "skip" as ReviewResult,
      }),
    ).toThrow("result");
  });
});

describe("buildActivityLog", () => {
  it("defaults counts to zero and guards against negatives", () => {
    const log = buildActivityLog({ date: "2024-05-01" });

    expect(log.addCount).toBe(0);
    expect(log.reviewCount).toBe(0);

    expect(() =>
      buildActivityLog({ date: "2024-05-01", reviewCount: -1 }),
    ).toThrow("reviewCount");
  });
});

describe("buildUser", () => {
  it("applies default review batch size and timestamps", () => {
    const now = "2024-05-02T00:00:00.000Z";

    const user = buildUser({ id: "user-1" }, now);

    expect(user.settings.defaultReviewBatchSize).toBe(
      DEFAULT_REVIEW_BATCH_SIZE,
    );
    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
  });

  it("rejects non-positive batch size", () => {
    expect(() =>
      buildUser({
        id: "user-1",
        settings: { defaultReviewBatchSize: 0 },
      }),
    ).toThrow("defaultReviewBatchSize");
  });
});
