import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import { create_card, update_card } from '../../domain/card/card_factory';
import { create_domain_error } from '../../shared/errors/domain_error';
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
        const normalized_word = update_result.data.word.trim();
        const duplicate = await storage_context.card_repository.find_card_by_word(normalized_word);
        if (duplicate && duplicate.id !== update_result.data.id) {
          throw create_domain_error(
            'card.duplicate_word',
            `The word "${normalized_word}" already exists in your collection.`,
          );
        }
        await storage_context.card_repository.upsert_card(update_result.data);
        return update_result.data;
      }
    }

    const normalized_word = payload.word?.trim() ?? '';
    if (!normalized_word) {
      throw create_domain_error('card.word_missing', 'Word is required.');
    }

    const existing_by_word = await storage_context.card_repository.find_card_by_word(normalized_word);
    if (existing_by_word) {
      throw create_domain_error(
        'card.duplicate_word',
        `The word "${normalized_word}" already exists in your collection.`,
      );
    }

    const create_result = create_card({
      word: payload.word,
      reading: payload.reading,
      context: payload.context,
      scene: payload.scene,
      example: payload.example,
      created_at: payload.created_at,
      familiarity: payload.familiarity,
    });

    if (!create_result.ok) {
      throw create_result.error;
    }

    await storage_context.card_repository.upsert_card(create_result.data);

    return create_result.data;
  });

  ipcMain.handle(APP_CHANNELS.CARD_LIST, async () => {
    return storage_context.card_repository.list_cards();
  });
}
