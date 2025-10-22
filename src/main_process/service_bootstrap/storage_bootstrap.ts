import { app } from 'electron';
import { join } from 'node:path';
import { FileStorageProvider } from '../../infrastructure/storage_providers/file_storage_provider';
import { CardRepository } from '../../infrastructure/persistence/card_repository';
import { ReviewSessionRepository } from '../../infrastructure/persistence/review_session_repository';
import { AnalyticsTracker } from '../../infrastructure/telemetry/analytics_tracker';

export interface StorageContext {
  readonly card_repository: CardRepository;
  readonly review_session_repository: ReviewSessionRepository;
  readonly analytics_tracker: AnalyticsTracker;
}

export async function bootstrap_storage(): Promise<StorageContext> {
  const user_data_path = app.getPath('userData');
  const storage_path = join(user_data_path, 'tango-card');
  const storage_driver = new FileStorageProvider(storage_path);

  const card_repository = new CardRepository(storage_driver);
  const review_session_repository = new ReviewSessionRepository(storage_driver);
  const analytics_tracker = new AnalyticsTracker(storage_driver);

  return {
    card_repository,
    review_session_repository,
    analytics_tracker,
  };
}
