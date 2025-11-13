import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import { SimpleReviewPolicy } from '../../domain/review/review_policy';
import type { ReviewSessionRecord } from '../../infrastructure/persistence/storage_driver';
import type {
  ReviewQueueRequest,
  ReviewUpdateRequest,
} from '../../shared/ipc/contracts';

const review_policy = new SimpleReviewPolicy();

export function register_review_session_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.REVIEW_QUEUE, async (_event, payload: ReviewQueueRequest | undefined) => {
    const cards = await storage_context.card_repository.list_cards();
    const size = payload?.size;
    return review_policy.generate_review_queue(cards, size);
  });

  ipcMain.handle(APP_CHANNELS.REVIEW_UPDATE, async (_event, payload: ReviewUpdateRequest) => {
    const card = await storage_context.card_repository.find_card(payload.card_id);
    if (!card) {
      throw new Error(`Card ${payload.card_id} not found.`);
    }

    const updated_card = review_policy.mark_reviewed(card);
    await storage_context.card_repository.upsert_card(updated_card);

    const record: ReviewSessionRecord = {
      card_id: payload.card_id,
      reviewed_at: new Date().toISOString(),
    };
    await storage_context.review_session_repository.append_session(record);
    return updated_card;
  });
}
