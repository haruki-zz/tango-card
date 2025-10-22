import type {
  ReviewSessionRecord,
  StorageDriver
} from '../persistence/storage_driver';
import type { CardEntity } from '../../domain/card/card_entity';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';

/**
 * Placeholder provider reserved for future SQLite storage support.
 * For now it throws to signal the feature is pending.
 */
export class SqliteStorageProvider implements StorageDriver {
  async read_cards(): Promise<CardEntity[]> {
    throw new Error('SQLite storage not implemented yet.');
  }

  async write_cards(): Promise<void> {
    throw new Error('SQLite storage not implemented yet.');
  }

  async read_review_sessions(): Promise<ReviewSessionRecord[]> {
    throw new Error('SQLite storage not implemented yet.');
  }

  async write_review_sessions(): Promise<void> {
    throw new Error('SQLite storage not implemented yet.');
  }

  async read_activity_snapshot(): Promise<ActivitySnapshot> {
    throw new Error('SQLite storage not implemented yet.');
  }

  async write_activity_snapshot(): Promise<void> {
    throw new Error('SQLite storage not implemented yet.');
  }
}
