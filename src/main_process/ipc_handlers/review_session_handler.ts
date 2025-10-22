import { ipcMain } from 'electron';
import { APP_CHANNELS } from '../../shared/constants/app_channels';
import type { StorageContext } from '../service_bootstrap/storage_bootstrap';
import { WeightedMemoryReviewPolicy } from '../../domain/review/review_policy';
import { MemoryLevel } from '../../domain/review/memory_level';
import type { ReviewSessionRecord } from '../../infrastructure/persistence/storage_driver';

const review_policy = new WeightedMemoryReviewPolicy();

interface ReviewQueueRequest {
  readonly size?: number;
}

interface ReviewUpdatePayload {
  readonly card_id: string;
  readonly memory_level: MemoryLevel;
}

export function register_review_session_handler(storage_context: StorageContext): void {
  ipcMain.handle(APP_CHANNELS.REVIEW_QUEUE, async (_event, payload: ReviewQueueRequest | undefined) => {
    const cards = await storage_context.card_repository.list_cards();
    return review_policy.generate_review_queue(cards, payload?.size);
  });

  ipcMain.handle(APP_CHANNELS.REVIEW_UPDATE, async (_event, payload: ReviewUpdatePayload) => {
    const card = await storage_context.card_repository.find_card(payload.card_id);
    if (!card) {
      throw new Error(`Card ${payload.card_id} not found.`);
    }

    const updated_card = review_policy.update_memory_level(card, payload.memory_level);
    await storage_context.card_repository.upsert_card(updated_card);

    const record: ReviewSessionRecord = {
      card_id: payload.card_id,
      reviewed_at: new Date().toISOString(),
      memory_level: payload.memory_level,
    };
    await storage_context.review_session_repository.append_session(record);
    await storage_context.analytics_tracker.record_card_reviewed(new Date(record.reviewed_at));

    return updated_card;
  });
}
