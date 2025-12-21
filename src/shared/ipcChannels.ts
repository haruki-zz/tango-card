export const IPC_CHANNELS = {
  aiGenerateWordData: 'ai:generateWordData',
  dbGetTodayQueue: 'db:getTodayQueue',
  dbAnswerReview: 'db:answerReview',
  dbCreateWord: 'db:createWord',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  filesImport: 'files:import',
  filesExport: 'files:export'
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
