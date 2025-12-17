import {
  DEFAULT_REVIEW_BATCH_SIZE,
  REVIEW_SELECTION_WEIGHT,
} from "@/app/lib/constants";
import { listWords } from "@/app/lib/db";
import { appStore } from "@/app/lib/state";
import { WordEntry } from "@/app/lib/types";

interface BuildQueueOptions {
  batchSize?: number;
  random?: () => number;
}

const shuffle = <T>(items: T[], randomFn: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const buildReviewQueue = (
  words: WordEntry[],
  options?: BuildQueueOptions,
): string[] => {
  const randomFn = options?.random ?? Math.random;
  const batchSize = options?.batchSize ?? DEFAULT_REVIEW_BATCH_SIZE;
  if (words.length === 0 || batchSize <= 0) {
    return [];
  }

  const unfamiliar = words.filter((word) => word.familiarity === "unfamiliar");
  const familiar = words.filter((word) => word.familiarity === "familiar");

  const targetSize = Math.min(batchSize, words.length);
  const totalWeight =
    REVIEW_SELECTION_WEIGHT.unfamiliar + REVIEW_SELECTION_WEIGHT.familiar;
  const baseUnfamiliar = Math.floor(
    (REVIEW_SELECTION_WEIGHT.unfamiliar / totalWeight) * targetSize,
  );
  const baseFamiliar = Math.floor(
    (REVIEW_SELECTION_WEIGHT.familiar / totalWeight) * targetSize,
  );

  let selectedUnfamiliar = Math.min(baseUnfamiliar, unfamiliar.length);
  let selectedFamiliar = Math.min(baseFamiliar, familiar.length);
  let remaining = targetSize - (selectedUnfamiliar + selectedFamiliar);

  if (remaining > 0) {
    const extraUnfamiliar = Math.min(
      unfamiliar.length - selectedUnfamiliar,
      remaining,
    );
    selectedUnfamiliar += extraUnfamiliar;
    remaining -= extraUnfamiliar;
  }

  if (remaining > 0) {
    const extraFamiliar = Math.min(
      familiar.length - selectedFamiliar,
      remaining,
    );
    selectedFamiliar += extraFamiliar;
    remaining -= extraFamiliar;
  }

  const shuffledUnfamiliar = shuffle(unfamiliar, randomFn);
  const shuffledFamiliar = shuffle(familiar, randomFn);

  let queue = [
    ...shuffledUnfamiliar.slice(0, selectedUnfamiliar).map((word) => word.id),
    ...shuffledFamiliar.slice(0, selectedFamiliar).map((word) => word.id),
  ];

  if (queue.length < targetSize) {
    const fallbackPool = shuffle(
      [
        ...shuffledUnfamiliar.slice(selectedUnfamiliar),
        ...shuffledFamiliar.slice(selectedFamiliar),
      ],
      randomFn,
    ).filter((word) => !queue.includes(word.id));

    queue = [
      ...queue,
      ...fallbackPool
        .slice(0, targetSize - queue.length)
        .map((word) => word.id),
    ];
  }

  return shuffle(queue, randomFn);
};

export const prepareReviewQueue = async (
  db: Parameters<typeof listWords>[0],
  options?: BuildQueueOptions,
): Promise<{ queue: string[]; words: WordEntry[] }> => {
  const words = await listWords(db);
  const queue = buildReviewQueue(words, options);

  const { setWords, setReviewQueue } = appStore.getState();
  setWords(words);
  setReviewQueue(queue);

  return { queue, words };
};
