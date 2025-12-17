import {
  enqueueReviewEventForSync,
  enqueueWordForSync,
  incrementActivityLog,
  insertReviewEvent,
  updateWord,
  DatabaseConnection,
} from "@/app/lib/db";
import { appStore } from "@/app/lib/state";
import type {
  ReviewEvent,
  WordEntry,
} from "@/app/lib/types";

export type ReviewAction = "familiar" | "unfamiliar" | "skip";

const generateReviewEventId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `review-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatActivityDate = (date: Date) => date.toISOString().slice(0, 10);

export const applyReviewAction = async (
  params: {
    db: DatabaseConnection;
    word: WordEntry;
    action: ReviewAction;
    clock?: () => Date;
  },
): Promise<{ updatedWord: WordEntry; event: ReviewEvent }> => {
  const now = params.clock ? params.clock() : new Date();
  const timestamp = now.toISOString();
  const activityDate = formatActivityDate(now);
  const nextFamiliarity =
    params.action === "skip" ? params.word.familiarity : params.action;

  const updatedWord = await updateWord(
    params.db,
    {
      ...params.word,
      familiarity: nextFamiliarity,
      reviewCount: params.word.reviewCount + 1,
      lastReviewedAt: timestamp,
      updatedAt: timestamp,
    },
    timestamp,
  );

  const event = await insertReviewEvent(
    params.db,
    {
      id: generateReviewEventId(),
      wordId: params.word.id,
      result: nextFamiliarity,
      timestamp,
    },
    timestamp,
  );

  await incrementActivityLog(params.db, activityDate, {
    reviewDelta: 1,
  });

  await enqueueWordForSync(params.db, updatedWord, now);
  await enqueueReviewEventForSync(params.db, event, now);

  const { upsertWord, incrementActivity } = appStore.getState();
  upsertWord(updatedWord);
  incrementActivity(activityDate, { reviewDelta: 1 });

  return { updatedWord, event };
};
