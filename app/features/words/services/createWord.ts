import {
  enqueueWordForSync,
  incrementActivityLog,
  insertWord,
  DatabaseConnection,
} from "@/app/lib/db";
import { appStore } from "@/app/lib/state";
import {
  AiMetadata,
  Familiarity,
  WordEntry,
} from "@/app/lib/types";

export interface NewWordInput {
  surface: string;
  reading: string;
  meaningZh: string;
  exampleJa: string;
  familiarity?: Familiarity;
  aiMeta?: AiMetadata;
}

const generateWordId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `word-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatActivityDate = (date: Date) => date.toISOString().slice(0, 10);

export const createWordWithActivity = async (
  db: DatabaseConnection,
  input: NewWordInput,
  now = new Date(),
): Promise<{ word: WordEntry }> => {
  const timestamp = now.toISOString();
  const activityDate = formatActivityDate(now);
  const word = await insertWord(
    db,
    {
      ...input,
      id: generateWordId(),
    },
    timestamp,
  );

  await incrementActivityLog(db, activityDate, { addDelta: 1 });
  await enqueueWordForSync(db, word, now);

  const { upsertWord, incrementActivity } = appStore.getState();
  upsertWord(word);
  incrementActivity(activityDate, { addDelta: 1 });

  return { word };
};
