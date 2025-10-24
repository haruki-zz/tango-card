import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { StorageDriver } from '../../../../src/infrastructure/persistence/storage_driver';
import {
  create_storage_driver,
  register_storage_engine,
  is_storage_engine_registered,
} from '../../../../src/infrastructure/persistence/storage_engine';
import '../../../../src/infrastructure/persistence/engines/file_storage_engine';

describe('storage_engine registry', () => {
  it('creates a driver for registered file engine', async () => {
    const base_path = await mkdtemp(join(tmpdir(), 'tango-card-test-'));
    const driver = await create_storage_driver({
      type: 'file',
      options: { base_path },
    });
    expect(typeof driver.read_cards).toBe('function');
    const cards = await driver.read_cards();
    expect(Array.isArray(cards)).toBe(true);
  });

  it('prevents duplicate registration for the same engine type', () => {
    const type = `test-${Date.now()}`;
    const stub_driver: StorageDriver = {
      read_cards: async () => [],
      write_cards: async () => undefined,
      read_review_sessions: async () => [],
      write_review_sessions: async () => undefined,
      read_activity_snapshot: async () => ({
        streak_days: 0,
        total_cards: 0,
        total_reviews: 0,
        points: [],
      }),
      write_activity_snapshot: async () => undefined,
    };

    register_storage_engine({
      type,
      create_driver: async () => stub_driver,
    });

    expect(is_storage_engine_registered(type)).toBe(true);
    expect(() =>
      register_storage_engine({
        type,
        create_driver: async () => stub_driver,
      }),
    ).toThrow(`Storage engine "${type}" is already registered.`);
  });
});
