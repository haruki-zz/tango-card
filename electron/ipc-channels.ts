export const IPC_CHANNELS = Object.freeze({
  word: Object.freeze({
    add: 'word:add',
    listRandom: 'word:listRandom'
  }),
  review: Object.freeze({
    create: 'review:create'
  }),
  activity: Object.freeze({
    stats: 'activity:stats'
  }),
  ai: Object.freeze({
    generateForWord: 'ai:generateForWord'
  })
});

export type IpcChannelMap = typeof IPC_CHANNELS;
