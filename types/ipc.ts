export type WordMeaning = {
  jp: string;
  zh: string;
  context?: string;
};

export type WordExample = {
  jp: string;
  zh: string;
};

export type WordInput = {
  term: string;
  reading?: string;
  meanings?: WordMeaning[];
  examples?: WordExample[];
  note?: string;
};

export type Word = WordInput & {
  id: string;
  created_at: string;
};

export type WordListOptions = {
  limit?: number;
};

export type ReviewResult = {
  word_id: string;
  status: 'familiar' | 'unfamiliar';
};

export type ReviewSessionInput = {
  word_ids: string[];
  results: ReviewResult[];
  started_at: string;
  completed_at?: string;
};

export type ActivityRange = {
  from?: string;
  to?: string;
};

export type ActivityStat = {
  date: string;
  words_added: number;
  reviews_completed: number;
};

export type AiGenerateInput = {
  term: string;
  note?: string;
};

export type AiGenerateResult = {
  reading?: string;
  meanings?: WordMeaning[];
  examples?: WordExample[];
};

export type ElectronAPI = {
  word: {
    add: (payload: WordInput) => Promise<void>;
    listRandom: (options?: WordListOptions) => Promise<Word[]>;
  };
  review: {
    create: (input: ReviewSessionInput) => Promise<void>;
  };
  activity: {
    stats: (range?: ActivityRange) => Promise<ActivityStat[]>;
  };
  ai: {
    generateForWord: (input: AiGenerateInput) => Promise<AiGenerateResult>;
  };
};
