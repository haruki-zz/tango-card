import { WordEntry } from "@/app/lib/types";

export type RandomFn = () => number;

const pickWithHighestReview = (
  words: WordEntry[],
  randomFn: RandomFn,
): WordEntry | null => {
  if (words.length === 0) {
    return null;
  }

  const maxReviewCount = words.reduce(
    (max, word) => Math.max(max, word.reviewCount),
    0,
  );
  const candidates = words.filter(
    (word) => word.reviewCount === maxReviewCount,
  );
  const index = Math.floor(randomFn() * candidates.length);
  return candidates[index] ?? null;
};

export const selectFeaturedWord = (
  words: WordEntry[],
  randomFn: RandomFn = Math.random,
): WordEntry | null => {
  if (!words.length) {
    return null;
  }

  const unfamiliar = words.filter(
    (word) => word.familiarity === "unfamiliar",
  );
  const familiar = words.filter(
    (word) => word.familiarity === "familiar",
  );

  return (
    pickWithHighestReview(unfamiliar, randomFn) ??
    pickWithHighestReview(familiar, randomFn)
  );
};
