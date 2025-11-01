import { app } from 'electron';
import { join, resolve, isAbsolute } from 'node:path';
import { CardRepository } from '../../infrastructure/persistence/card_repository';
import { ReviewSessionRepository } from '../../infrastructure/persistence/review_session_repository';
import { AnalyticsTracker } from '../../infrastructure/telemetry/analytics_tracker';
import { create_storage_driver } from '../../infrastructure/persistence/storage_engine';
import type { FileStorageEngineOptions } from '../../infrastructure/persistence/engines/file_storage_engine';
import '../../infrastructure/persistence/engines/file_storage_engine';

export interface StorageContext {
  readonly card_repository: CardRepository;
  readonly review_session_repository: ReviewSessionRepository;
  readonly analytics_tracker: AnalyticsTracker;
}

export async function bootstrap_storage(): Promise<StorageContext> {
  const override = process.env.TANGO_CARD_DATA_DIR;
  const resolved_override =
    override && override.length > 0
      ? isAbsolute(override)
        ? override
        : resolve(app.getAppPath(), override)
      : undefined;

  const base_root = resolved_override ?? app.getPath('userData');
  const storage_path = resolved_override ?? join(base_root, 'tango-card');
  const storage_driver = await create_storage_driver<FileStorageEngineOptions>({
    type: 'file',
    options: { base_path: storage_path },
  });

  const card_repository = new CardRepository(storage_driver);
  const review_session_repository = new ReviewSessionRepository(storage_driver);
  const analytics_tracker = new AnalyticsTracker(storage_driver);

  return {
    card_repository,
    review_session_repository,
    analytics_tracker,
  };
}
