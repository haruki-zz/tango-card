import type { CardEntity } from '../../domain/card/card_entity';
import type { MemoryLevel } from '../../domain/review/memory_level';

export interface ReviewSessionRecord {
  readonly card_id: string;
  readonly reviewed_at: string;
  readonly memory_level: MemoryLevel;
}

export interface StorageDriver {
  read_cards(): Promise<CardEntity[]>;
  write_cards(cards: CardEntity[]): Promise<void>;
  read_review_sessions(): Promise<ReviewSessionRecord[]>;
  write_review_sessions(records: ReviewSessionRecord[]): Promise<void>;
}
