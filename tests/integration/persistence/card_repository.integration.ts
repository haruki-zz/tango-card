import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CardRepository } from '../../../src/infrastructure/persistence/card_repository';
import { FileStorageProvider } from '../../../src/infrastructure/storage_providers/file_storage_provider';
import { create_card } from '../../../src/domain/card/card_factory';

describe('CardRepository with FileStorageProvider', () => {
  const base_dir = mkdtempSync(join(tmpdir(), 'tango-card-'));
  const storage = new FileStorageProvider(base_dir);
  const repository = new CardRepository(storage);

  afterAll(() => {
    rmSync(base_dir, { recursive: true, force: true });
  });

  it('persists and retrieves cards', async () => {
    const create_result = create_card({ svg_source: '<svg></svg>' });
    if (!create_result.ok) {
      throw create_result.error;
    }
    await repository.upsert_card(create_result.data);
    const cards = await repository.list_cards();
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe(create_result.data.id);
  });
});
