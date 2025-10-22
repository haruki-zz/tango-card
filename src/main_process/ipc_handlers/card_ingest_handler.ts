import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import { create_card } from '../../domain/card/card_factory';

interface CardIngestPayload {
  readonly svg_source: string;
  readonly tags?: string[];
}

export function register_card_ingest_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.CARD_INGEST, async (_event, payload: CardIngestPayload) => {
    const result = create_card({
      svg_source: payload.svg_source,
      tags: payload.tags ?? [],
    });

    if (!result.ok) {
      throw result.error;
    }

    await storage_context.card_repository.upsert_card(result.data);
    await storage_context.analytics_tracker.record_card_created(new Date(result.data.created_at));

    return result.data;
  });

  ipcMain.handle(APP_CHANNELS.CARD_LIST, async () => {
    return storage_context.card_repository.list_cards();
  });
}
