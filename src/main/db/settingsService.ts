import { eq, type InferSelectModel } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { AppSettings } from '../../shared/apiTypes';
import { SETTINGS_SINGLETON_ID, schema, settings } from './schema';

type SettingsRow = InferSelectModel<typeof settings>;

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: null,
  preferredModel: 'gemini-2.5-flash',
  reviewBatchSize: 1,
  theme: 'light'
};

export async function getAppSettings(
  db: BetterSQLite3Database<typeof schema>
): Promise<AppSettings> {
  const row = await db.query.settings.findFirst();
  if (!row) {
    await db
      .insert(settings)
      .values({ id: SETTINGS_SINGLETON_ID })
      .onConflictDoNothing();
    return { ...DEFAULT_SETTINGS };
  }

  return mapRow(row);
}

export async function updateAppSettings(
  db: BetterSQLite3Database<typeof schema>,
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getAppSettings(db);
  const next: AppSettings = {
    apiKey: normalizeApiKey(patch.apiKey, current.apiKey),
    preferredModel: normalizeModel(patch.preferredModel, current.preferredModel),
    reviewBatchSize: normalizeBatchSize(
      patch.reviewBatchSize,
      current.reviewBatchSize
    ),
    theme: normalizeTheme(patch.theme, current.theme)
  };

  await db
    .update(settings)
    .set({
      apiKey: next.apiKey,
      preferredModel: next.preferredModel,
      reviewBatchSize: next.reviewBatchSize,
      theme: next.theme
    })
    .where(eq(settings.id, SETTINGS_SINGLETON_ID));

  return next;
}

function mapRow(row: SettingsRow): AppSettings {
  return {
    apiKey: normalizeApiKey(row.apiKey, DEFAULT_SETTINGS.apiKey),
    preferredModel: normalizeModel(row.preferredModel, DEFAULT_SETTINGS.preferredModel),
    reviewBatchSize: normalizeBatchSize(
      row.reviewBatchSize,
      DEFAULT_SETTINGS.reviewBatchSize
    ),
    theme: normalizeTheme(row.theme, DEFAULT_SETTINGS.theme)
  };
}

function normalizeApiKey(value: string | null | undefined, fallback: string | null) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeModel(
  value: string | null | undefined,
  fallback: AppSettings['preferredModel']
): AppSettings['preferredModel'] {
  if (value === 'gpt-4o' || value === 'gpt-4.1-mini') {
    return value;
  }
  if (value === 'gemini-2.5-flash' || value === 'gemini-flash-2.5-lite') {
    return 'gemini-2.5-flash';
  }
  return fallback;
}

function normalizeBatchSize(value: number | null | undefined, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }
  return fallback;
}

function normalizeTheme(
  value: string | null | undefined,
  fallback: AppSettings['theme']
): AppSettings['theme'] {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return fallback;
}
