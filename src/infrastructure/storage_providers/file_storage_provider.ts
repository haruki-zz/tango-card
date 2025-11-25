import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ReviewSessionRecord, StorageDriver } from '../persistence/storage_driver';
import type { CardEntity } from '../../domain/card/card_entity';

export class FileStorageProvider implements StorageDriver {
  private readonly base_path: string;

  constructor(base_path: string) {
    this.base_path = base_path;
  }

  async read_cards(): Promise<CardEntity[]> {
    const payload = await this.read_json<unknown>('words.json', {});
    return this.normalize_cards_payload(payload);
  }

  async write_cards(cards: CardEntity[]): Promise<void> {
    const payload: Record<string, CardEntity> = {};
    cards.forEach((card) => {
      payload[card.word] = card;
    });
    await this.write_json('words.json', payload);
  }

  async read_review_sessions(): Promise<ReviewSessionRecord[]> {
    return this.read_json<ReviewSessionRecord[]>('review_sessions.json', []);
  }

  async write_review_sessions(records: ReviewSessionRecord[]): Promise<void> {
    await this.write_json('review_sessions.json', records);
  }

  private async read_json<TSubject>(file_name: string, fallback: TSubject): Promise<TSubject> {
    await this.ensure_base();
    const full_path = join(this.base_path, file_name);
    if (!existsSync(full_path)) {
      return fallback;
    }
    const buffer = await readFile(full_path);
    try {
      return JSON.parse(buffer.toString()) as TSubject;
    } catch {
      return fallback;
    }
  }

  private async write_json(file_name: string, payload: unknown): Promise<void> {
    await this.ensure_base();
    const full_path = join(this.base_path, file_name);
    const serialized = JSON.stringify(payload, null, 2);
    await writeFile(full_path, serialized, { encoding: 'utf-8' });
  }

  private async ensure_base(): Promise<void> {
    if (!existsSync(this.base_path)) {
      await mkdir(this.base_path, { recursive: true });
    }
  }

  private normalize_cards_payload(subject: unknown): CardEntity[] {
    const apply_defaults = (card: CardEntity): CardEntity => ({
      ...card,
      familiarity: card.familiarity ?? 'normal',
    });
    if (Array.isArray(subject)) {
      return (subject as CardEntity[]).map(apply_defaults);
    }
    if (subject && typeof subject === 'object') {
      const record = subject as Record<string, CardEntity>;
      return Object.values(record).map(apply_defaults);
    }
    return [];
  }
}
