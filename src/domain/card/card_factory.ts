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
  const memory_level = input.memory_level ?? MEMORY_LEVEL_DEFAULT;

  const card: CardEntity = {
    id: create_uuid(),
    svg_source: trimmed_svg,
    created_at,
    memory_level,
    review_count: 0,
    last_reviewed_at: undefined,
  };

  return create_success_result(card);
}

export function update_card(existing: CardEntity, patch: CardDraft): Result<CardEntity, Error> {
  const svg_source = resolve_svg_source(existing, patch);
  if (!svg_source) {
    return create_failure_result(
      create_domain_error('card_factory.svg_empty', 'SVG source must not be empty.'),
    );
  }

  const memory_level = patch.memory_level ?? existing.memory_level;
  const created_at = patch.created_at ?? existing.created_at;

  const updated_card: CardEntity = {
    ...existing,
    svg_source,
    memory_level,
    created_at,
  };

  return create_success_result(updated_card);
}

function resolve_svg_source(existing: CardEntity, patch: CardDraft): string | null {
  if (typeof patch.svg_source === 'string') {
    const trimmed = patch.svg_source.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }
  const preserved = existing.svg_source.trim();
  return preserved ? preserved : null;
}
