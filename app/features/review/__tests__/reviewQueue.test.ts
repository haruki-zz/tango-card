import { buildReviewQueue } from "../services/reviewQueue";
import { WordEntry } from "@/app/lib/types";

const fixedTimestamp = "2024-05-01T00:00:00.000Z";

const buildWord = (
  id: string,
  familiarity: WordEntry["familiarity"],
): WordEntry => ({
  id,
  surface: `単語-${id}`,
  reading: `よみ-${id}`,
  meaningZh: `释义-${id}`,
  exampleJa: `例句-${id}`,
  familiarity,
  reviewCount: 1,
  lastReviewedAt: fixedTimestamp,
  createdAt: fixedTimestamp,
  updatedAt: fixedTimestamp,
});

const mapById = (words: WordEntry[]) =>
  words.reduce<Record<string, WordEntry>>((acc, word) => {
    acc[word.id] = word;
    return acc;
  }, {});

describe("buildReviewQueue", () => {
  it("按 2:1 权重抽取 30 条复习队列", () => {
    const words = [
      ...Array.from({ length: 24 }, (_, i) => buildWord(`u-${i}`, "unfamiliar")),
      ...Array.from({ length: 16 }, (_, i) => buildWord(`f-${i}`, "familiar")),
    ];
    const queue = buildReviewQueue(words, { random: () => 0.2 });
    const byId = mapById(words);

    expect(queue).toHaveLength(30);

    const selected = queue.map((id) => byId[id]);
    const unfamiliarCount = selected.filter((word) => word.familiarity === "unfamiliar").length;
    const familiarCount = selected.length - unfamiliarCount;

    expect(unfamiliarCount).toBe(20);
    expect(familiarCount).toBe(10);
  });

  it("不熟不足时用熟悉补足队列", () => {
    const words = [
      ...Array.from({ length: 5 }, (_, i) => buildWord(`u-${i}`, "unfamiliar")),
      ...Array.from({ length: 20 }, (_, i) => buildWord(`f-${i}`, "familiar")),
    ];

    const queue = buildReviewQueue(words, { random: () => 0.4 });
    const byId = mapById(words);

    expect(queue).toHaveLength(25);

    const selected = queue.map((id) => byId[id]);
    const unfamiliarCount = selected.filter((word) => word.familiarity === "unfamiliar").length;
    const familiarCount = selected.length - unfamiliarCount;

    expect(unfamiliarCount).toBe(5);
    expect(familiarCount).toBe(20);
  });

  it("总量不足批次时返回全部单词", () => {
    const words = [
      buildWord("one", "unfamiliar"),
      buildWord("two", "familiar"),
      buildWord("three", "unfamiliar"),
      buildWord("four", "familiar"),
    ];

    const queue = buildReviewQueue(words, { random: () => 0.7 });
    expect(queue.sort()).toEqual(words.map((word) => word.id).sort());
  });
});
