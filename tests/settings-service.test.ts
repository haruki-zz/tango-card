import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/main/db/database';
import type { AppSettings } from '../src/shared/apiTypes';
import { getAppSettings, updateAppSettings } from '../src/main/db/settingsService';

describe('settingsService', () => {
  it('reads defaults from seeded settings row', async () => {
    const context = initializeDatabase(':memory:');
    const settings = await getAppSettings(context.db);

    expect(settings).toEqual({
      apiKey: null,
      preferredModel: 'gemini-flash-2.5-lite',
      reviewBatchSize: 1,
      theme: 'light'
    });
  });

  it('persists updates and normalizes values', async () => {
    const context = initializeDatabase(':memory:');
    const updated = await updateAppSettings(context.db, {
      apiKey: '  sk-test-123  ',
      preferredModel: 'gpt-4o',
      reviewBatchSize: 3.6,
      theme: 'dark'
    });

    expect(updated.apiKey).toBe('sk-test-123');
    expect(updated.reviewBatchSize).toBe(3);
    expect(updated.preferredModel).toBe('gpt-4o');
    expect(updated.theme).toBe('dark');

    const row = context.sqlite
      .prepare(
        'SELECT api_key, preferred_model, review_batch_size, theme FROM settings WHERE id = 1'
      )
      .get();

    expect(row.api_key).toBe('sk-test-123');
    expect(row.preferred_model).toBe('gpt-4o');
    expect(row.review_batch_size).toBe(3);
    expect(row.theme).toBe('dark');
  });

  it('ignores invalid values and keeps last valid settings', async () => {
    const context = initializeDatabase(':memory:');
    await updateAppSettings(context.db, { preferredModel: 'gpt-4o' });

    const rolledBack = await updateAppSettings(context.db, {
      preferredModel: 'unsupported-model',
      theme: 'unknown' as AppSettings['theme'],
      reviewBatchSize: -2
    });

    expect(rolledBack.preferredModel).toBe('gpt-4o');
    expect(rolledBack.theme).toBe('light');
    expect(rolledBack.reviewBatchSize).toBe(1);
  });
});
