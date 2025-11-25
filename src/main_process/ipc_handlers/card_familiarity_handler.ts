import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import type { Familiarity } from '../../domain/card/card_entity';

interface FamiliarityPayload {
  readonly card_id: string;
  readonly familiarity: Familiarity;
}

export function register_card_familiarity_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.CARD_FAMILIARITY, async (_event, payload: FamiliarityPayload) => {
    const card = await storage_context.card_repository.find_card(payload.card_id);
    if (!card) {
      throw new Error(`Card ${payload.card_id} not found.`);
    }

    const updated_card = {
      ...card,
      familiarity: payload.familiarity,
    };
    await storage_context.card_repository.upsert_card(updated_card);
    return updated_card;
  });
}
