import { create_failure_result, create_success_result, Result } from '../shared/result';
import type { CardDraft, CardEntity } from './card_entity';
import { MEMORY_LEVEL_DEFAULT } from '../review/memory_level';
import { create_uuid } from '../../shared/utils/uuid';
import { create_domain_error } from '../../shared/errors/domain_error';
import { get_iso_timestamp } from '../../shared/utils/date_utils';

export function create_card(input: CardDraft): Result<CardEntity, Error> {
  const trimmed_svg = input.svg_source.trim();
  if (!trimmed_svg) {
    return create_failure_result(
      create_domain_error('card_factory.svg_empty', 'SVG source must not be empty.'),
    );
  }

  const created_at = input.created_at ?? get_iso_timestamp();
  const tags = normalize_tags(input.tags);
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

function normalize_tags(tags: CardDraft['tags']): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  tags.forEach((tag) => {
    const value = tag.trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  });
  return normalized;
}
