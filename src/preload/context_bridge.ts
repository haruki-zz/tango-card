import { contextBridge, ipcRenderer } from 'electron';
import { APP_CHANNELS } from '../shared/constants/app_channels';
import type { CardEntity } from '../domain/card/card_entity';
import type { ReviewCandidate } from '../domain/review/review_policy';
import type { MemoryLevel } from '../domain/review/memory_level';
import type { ActivitySnapshot } from '../domain/analytics/activity_snapshot';

export interface RendererApi {
  ingest_card(payload: { svg_source: string; tags?: string[] }): Promise<CardEntity>;
  list_cards(): Promise<CardEntity[]>;
  fetch_review_queue(size?: number): Promise<ReviewCandidate[]>;
  update_review(card_id: string, memory_level: MemoryLevel): Promise<CardEntity>;
  fetch_analytics_snapshot(): Promise<ActivitySnapshot>;
}

const api: RendererApi = {
  ingest_card: (payload) => ipcRenderer.invoke(APP_CHANNELS.CARD_INGEST, payload),
  list_cards: () => ipcRenderer.invoke(APP_CHANNELS.CARD_LIST),
  fetch_review_queue: (size) => ipcRenderer.invoke(APP_CHANNELS.REVIEW_QUEUE, { size }),
  update_review: (card_id, memory_level) =>
    ipcRenderer.invoke(APP_CHANNELS.REVIEW_UPDATE, { card_id, memory_level }),
  fetch_analytics_snapshot: () => ipcRenderer.invoke(APP_CHANNELS.ANALYTICS_SNAPSHOT),
};

declare global {
  interface Window {
    readonly tango_api: RendererApi;
  }
}

contextBridge.exposeInMainWorld('tango_api', api);
