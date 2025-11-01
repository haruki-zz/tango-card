import { MemoryLevel } from '../review/memory_level';

export interface CardEntity {
  readonly id: string;
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly scene: string;
  readonly example: string;
  readonly created_at: string;
  readonly memory_level: MemoryLevel;
  readonly review_count: number;
  readonly last_reviewed_at?: string;
}

export interface CardDraft {
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly scene: string;
  readonly example: string;
  readonly memory_level?: MemoryLevel;
  readonly created_at?: string;
}

export function is_card_entity(subject: unknown): subject is CardEntity {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }
  const candidate = subject as Partial<CardEntity>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.word === 'string' &&
    typeof candidate.reading === 'string' &&
    typeof candidate.context === 'string' &&
    typeof candidate.scene === 'string' &&
    typeof candidate.example === 'string' &&
    typeof candidate.created_at === 'string' &&
    typeof candidate.memory_level === 'string' &&
    typeof candidate.review_count === 'number'
  );
}
