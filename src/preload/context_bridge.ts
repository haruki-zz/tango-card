import { contextBridge, ipcRenderer } from 'electron';
import { APP_CHANNELS } from '../shared/constants/app_channels';
import type { RendererApi } from '../shared/ipc/contracts';

const api: RendererApi = {
  ingest_card: (payload) => ipcRenderer.invoke(APP_CHANNELS.CARD_INGEST, payload),
  list_cards: () => ipcRenderer.invoke(APP_CHANNELS.CARD_LIST),
  fetch_review_queue: (request) =>
    ipcRenderer.invoke(APP_CHANNELS.REVIEW_QUEUE, request ?? {}),
  update_review: (payload) => ipcRenderer.invoke(APP_CHANNELS.REVIEW_UPDATE, payload),
  fetch_analytics_snapshot: () => ipcRenderer.invoke(APP_CHANNELS.ANALYTICS_SNAPSHOT),
  export_cards: (request) => ipcRenderer.invoke(APP_CHANNELS.CARD_EXPORT, request),
  import_cards: () => ipcRenderer.invoke(APP_CHANNELS.CARD_IMPORT),
};

declare global {
  interface Window {
    readonly tango_api: RendererApi;
  }
}

contextBridge.exposeInMainWorld('tango_api', api);
