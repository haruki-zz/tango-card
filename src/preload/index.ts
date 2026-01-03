import { contextBridge, ipcRenderer } from 'electron';

import {
  IPC_CHANNELS,
  type RendererApi,
  type SafeProviderSettings,
} from '@shared/ipc';

const api: RendererApi = {
  generateWordContent: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.GENERATE_WORD, payload),
  addWord: (payload) => ipcRenderer.invoke(IPC_CHANNELS.ADD_WORD, payload),
  listWords: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_WORDS),
  getReviewQueue: () => ipcRenderer.invoke(IPC_CHANNELS.REVIEW_QUEUE),
  submitReview: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.SUBMIT_REVIEW, payload),
  getActivity: () => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_GET),
  incrementSession: (date) =>
    ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_INCREMENT_SESSION, { date }),
  getProvider: () =>
    ipcRenderer.invoke<SafeProviderSettings>(IPC_CHANNELS.GET_PROVIDER),
  setProvider: (config) =>
    ipcRenderer.invoke<SafeProviderSettings>(IPC_CHANNELS.SET_PROVIDER, config),
  exportData: () => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_DATA),
  importData: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_DATA, payload),
};

contextBridge.exposeInMainWorld('platformInfo', {
  platform: process.platform,
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});

contextBridge.exposeInMainWorld('api', api);
