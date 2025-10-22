import { create_failure_result, create_success_result, Result } from '../shared/result';
import type { CardEntity } from './card_entity';
import { MemoryLevel, MEMORY_LEVEL_DEFAULT } from '../review/memory_level';
import { create_uuid } from '../../shared/utils/uuid';
import { create_domain_error } from '../../shared/errors/domain_error';
import { get_iso_timestamp } from '../../shared/utils/date_utils';

export interface NewCardInput {
  readonly svg_source: string;
  readonly tags?: string[];
  readonly memory_level?: MemoryLevel;
  readonly created_at?: string;
}

export function create_card(input: NewCardInput): Result<CardEntity, Error> {
  const trimmed_svg = input.svg_source.trim();
  if (!trimmed_svg) {
    return create_failure_result(
      create_domain_error('card_factory.svg_empty', 'SVG source must not be empty.'),
    );
  }

  const created_at = input.created_at ?? get_iso_timestamp();
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => tag.trim()).filter(Boolean) : [];
  const memory_level = input.memory_level ?? MEMORY_LEVEL_DEFAULT;

  const card: CardEntity = {
    id: create_uuid(),
    svg_source: trimmed_svg,
    created_at,
    tags,
    memory_level,
    review_count: 0,
    last_reviewed_at: undefined,
  };

  return create_success_result(card);
}
