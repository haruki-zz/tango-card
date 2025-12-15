export const queryKeys = {
  words: () => ["words"] as const,
  word: (id: string) => ["words", id] as const,
  activityLogs: () => ["activityLogs"] as const,
  activityLog: (date: string) => ["activityLogs", date] as const,
  reviewQueue: () => ["reviewQueue"] as const,
};
