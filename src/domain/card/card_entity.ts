import { MemoryLevel } from '../review/memory_level';

export interface CardEntity {
  readonly id: string;
  readonly svg_source: string;
  readonly created_at: string;
  readonly tags: string[];
  readonly memory_level: MemoryLevel;
  readonly review_count: number;
  readonly last_reviewed_at?: string;
}

export interface CardDraft {
  readonly svg_source: string;
  readonly tags?: string[];
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
    typeof candidate.svg_source === 'string' &&
    typeof candidate.created_at === 'string' &&
    Array.isArray(candidate.tags) &&
    typeof candidate.memory_level === 'string' &&
    typeof candidate.review_count === 'number'
  );
}
