import { MemoryLevel, MEMORY_LEVEL_DEFAULT } from '../review/memory_level';

export interface CardEntity {
  readonly id: string;
  readonly svg_source: string;
  readonly created_at: string;
  readonly tags: string[];
  readonly memory_level: MemoryLevel;
  readonly review_count: number;
  readonly last_reviewed_at?: string;
}

export const CARD_DEFAULT: Omit<CardEntity, 'id' | 'svg_source'> = {
  created_at: '',
  tags: [],
  memory_level: MEMORY_LEVEL_DEFAULT,
  review_count: 0,
  last_reviewed_at: undefined
};
