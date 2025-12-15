import {
  DEFAULT_FAMILIARITY,
  DEFAULT_REVIEW_BATCH_SIZE,
  DEFAULT_REVIEW_COUNT,
  FAMILIARITY_VALUES,
  REVIEW_RESULT_VALUES,
} from "../constants";

export type Familiarity = (typeof FAMILIARITY_VALUES)[number];
export type ReviewResult = (typeof REVIEW_RESULT_VALUES)[number];

export interface AiMetadata {
  model: string;
  promptHash?: string;
}

export interface WordEntry {
  id: string;
  surface: string;
  reading: string;
  meaningZh: string;
  exampleJa: string;
  familiarity: Familiarity;
  reviewCount: number;
  lastReviewedAt: string;
  createdAt: string;
  updatedAt: string;
  aiMeta?: AiMetadata;
}

export interface WordEntryDraft {
  id: string;
  surface: string;
  reading: string;
  meaningZh: string;
  exampleJa: string;
  familiarity?: Familiarity;
  reviewCount?: number;
  lastReviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  aiMeta?: AiMetadata;
}

export interface ReviewEvent {
  id: string;
  wordId: string;
  result: ReviewResult;
  timestamp: string;
}

export interface ReviewEventDraft {
  id: string;
  wordId: string;
  result: ReviewResult;
  timestamp?: string;
}

export interface ActivityLog {
  date: string;
  addCount: number;
  reviewCount: number;
}

export interface ActivityLogDraft {
  date: string;
  addCount?: number;
  reviewCount?: number;
}

export interface UserProfile {
  displayName?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  defaultReviewBatchSize: number;
}

export interface User {
  id: string;
  profile?: UserProfile;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserDraft {
  id: string;
  profile?: UserProfile;
  settings?: Partial<UserSettings>;
  createdAt?: string;
  updatedAt?: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isIsoDateString = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const assertIsoDate = (value: string, field: string) => {
  if (!isIsoDateString(value)) {
    throw new Error(`${field} 需要有效的 ISO 时间字符串`);
  }

  return value;
};

const assertNonNegativeInteger = (
  value: number,
  field: string,
  allowZero: boolean,
) => {
  const isValid = allowZero ? value >= 0 : value > 0;

  if (!Number.isInteger(value) || !isValid) {
    throw new Error(`${field} 需要${allowZero ? "非负" : "正"}整数`);
  }
};

const assertAiMetadata = (meta?: AiMetadata) => {
  if (!meta) {
    return undefined;
  }

  if (!isNonEmptyString(meta.model)) {
    throw new Error("aiMeta.model 为必填字段");
  }

  return { model: meta.model.trim(), promptHash: meta.promptHash };
};

export const isFamiliarity = (value: unknown): value is Familiarity =>
  typeof value === "string" &&
  (FAMILIARITY_VALUES as readonly string[]).includes(value);

export const isReviewResult = (value: unknown): value is ReviewResult =>
  typeof value === "string" &&
  (REVIEW_RESULT_VALUES as readonly string[]).includes(value);

export const buildWordEntry = (
  draft: WordEntryDraft,
  timestamp = new Date().toISOString(),
): WordEntry => {
  const requiredStrings: Array<keyof WordEntryDraft> = [
    "id",
    "surface",
    "reading",
    "meaningZh",
    "exampleJa",
  ];

  requiredStrings.forEach((key) => {
    if (!isNonEmptyString(draft[key])) {
      throw new Error(`${String(key)} 为必填字段`);
    }
  });

  const createdAt = assertIsoDate(
    draft.createdAt ?? timestamp,
    "createdAt",
  );
  const updatedAt = assertIsoDate(
    draft.updatedAt ?? createdAt,
    "updatedAt",
  );

  const familiarity = draft.familiarity ?? DEFAULT_FAMILIARITY;
  if (!isFamiliarity(familiarity)) {
    throw new Error("familiarity 取值非法");
  }

  const reviewCount = draft.reviewCount ?? DEFAULT_REVIEW_COUNT;
  assertNonNegativeInteger(reviewCount, "reviewCount", false);

  const lastReviewedAt = assertIsoDate(
    draft.lastReviewedAt ?? createdAt,
    "lastReviewedAt",
  );

  return {
    id: draft.id.trim(),
    surface: draft.surface.trim(),
    reading: draft.reading.trim(),
    meaningZh: draft.meaningZh.trim(),
    exampleJa: draft.exampleJa.trim(),
    familiarity,
    reviewCount,
    lastReviewedAt,
    createdAt,
    updatedAt,
    aiMeta: assertAiMetadata(draft.aiMeta),
  };
};

export const buildReviewEvent = (
  draft: ReviewEventDraft,
  timestamp = new Date().toISOString(),
): ReviewEvent => {
  if (!isNonEmptyString(draft.id)) {
    throw new Error("id 为必填字段");
  }
  if (!isNonEmptyString(draft.wordId)) {
    throw new Error("wordId 为必填字段");
  }
  if (!isReviewResult(draft.result)) {
    throw new Error("result 取值非法");
  }

  return {
    id: draft.id.trim(),
    wordId: draft.wordId.trim(),
    result: draft.result,
    timestamp: assertIsoDate(draft.timestamp ?? timestamp, "timestamp"),
  };
};

export const buildActivityLog = (draft: ActivityLogDraft): ActivityLog => {
  if (!isIsoDateString(draft.date)) {
    throw new Error("date 需要有效的 ISO 日期字符串");
  }

  const addCount = draft.addCount ?? 0;
  const reviewCount = draft.reviewCount ?? 0;

  assertNonNegativeInteger(addCount, "addCount", true);
  assertNonNegativeInteger(reviewCount, "reviewCount", true);

  return {
    date: draft.date,
    addCount,
    reviewCount,
  };
};

export const buildUser = (
  draft: UserDraft,
  timestamp = new Date().toISOString(),
): User => {
  if (!isNonEmptyString(draft.id)) {
    throw new Error("id 为必填字段");
  }

  const batchSize =
    draft.settings?.defaultReviewBatchSize ?? DEFAULT_REVIEW_BATCH_SIZE;

  assertNonNegativeInteger(batchSize, "defaultReviewBatchSize", false);

  const createdAt = assertIsoDate(
    draft.createdAt ?? timestamp,
    "createdAt",
  );
  const updatedAt = assertIsoDate(
    draft.updatedAt ?? createdAt,
    "updatedAt",
  );

  return {
    id: draft.id.trim(),
    profile: draft.profile,
    settings: { defaultReviewBatchSize: batchSize },
    createdAt,
    updatedAt,
  };
};
