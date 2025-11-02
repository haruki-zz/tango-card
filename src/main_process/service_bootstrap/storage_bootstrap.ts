import { app } from 'electron';
import { join, resolve, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CardRepository } from '../../infrastructure/persistence/card_repository';
import { ReviewSessionRepository } from '../../infrastructure/persistence/review_session_repository';
import { AnalyticsTracker } from '../../infrastructure/telemetry/analytics_tracker';
import { create_storage_driver } from '../../infrastructure/persistence/storage_engine';
import type { FileStorageEngineOptions } from '../../infrastructure/persistence/engines/file_storage_engine';
import '../../infrastructure/persistence/engines/file_storage_engine';
import type { CardEntity } from '../../domain/card/card_entity';

export interface StorageContext {
  readonly card_repository: CardRepository;
  readonly review_session_repository: ReviewSessionRepository;
  readonly analytics_tracker: AnalyticsTracker;
}

export async function bootstrap_storage(): Promise<StorageContext> {
  const override = process.env.TANGO_CARD_DATA_DIR;
  const resolved_override =
    override && override.length > 0
      ? resolve_data_directory_override(override)
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

  const context: StorageContext = {
    card_repository,
    review_session_repository,
    analytics_tracker,
  };

  if (resolved_override) {
    await seed_sample_data(resolved_override, context);
  }

  return context;
}

function resolve_data_directory_override(override: string): string {
  if (isAbsolute(override)) {
    return override;
  }

  const module_url = pathToFileURL(__filename);
  const module_dir = fileURLToPath(new URL('.', module_url));
  const candidate_roots = [
    process.cwd(),
    app.getAppPath(),
    resolve(module_dir, '../../../..'),
  ];
  for (const root of candidate_roots) {
    const candidate_path = resolve(root, override);
    if (existsSync(candidate_path)) {
      return candidate_path;
    }
  }

  return resolve(process.cwd(), override);
}

async function seed_sample_data(base_path: string, context: StorageContext): Promise<void> {
  const existing_cards = await context.card_repository.list_cards();
  if (existing_cards.length > 0) {
    return;
  }

  const cards_path = join(base_path, 'cards.json');
  if (!existsSync(cards_path)) {
    return;
  }

  try {
    const cards_payload = JSON.parse(await readFile(cards_path, 'utf-8'));
    if (Array.isArray(cards_payload) && cards_payload.length > 0) {
      await context.card_repository.replace_cards(cards_payload);
      return;
    }
    if (cards_payload && typeof cards_payload === 'object') {
      await context.card_repository.replace_cards(
        Object.values(cards_payload as Record<string, CardEntity>),
      );
    }
  } catch {
    return;
  }
}
