import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import { create_card, update_card } from '../../domain/card/card_factory';
import type { CardIngestRequest } from '../../shared/ipc/contracts';

export function register_card_ingest_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.CARD_INGEST, async (_event, payload: CardIngestRequest) => {
    if (payload.card_id) {
      const existing = await storage_context.card_repository.find_card(payload.card_id);
      if (existing) {
        const update_result = update_card(existing, payload);
        if (!update_result.ok) {
          throw update_result.error;
        }
        await storage_context.card_repository.upsert_card(update_result.data);
        return update_result.data;
      }
    }

    const create_result = create_card({
      svg_source: payload.svg_source,
      tags: payload.tags ?? [],
      memory_level: payload.memory_level,
      created_at: payload.created_at,
    });

    if (!create_result.ok) {
      throw create_result.error;
    }

    await storage_context.card_repository.upsert_card(create_result.data);
    await storage_context.analytics_tracker.record_card_created(
      new Date(create_result.data.created_at),
    );

    return create_result.data;
  });

  ipcMain.handle(APP_CHANNELS.CARD_LIST, async () => {
    return storage_context.card_repository.list_cards();
  });
}
