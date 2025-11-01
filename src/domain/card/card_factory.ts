import { create_failure_result, create_success_result, Result } from '../shared/result';
import type { CardDraft, CardEntity } from './card_entity';
import { MEMORY_LEVEL_DEFAULT } from '../review/memory_level';
import { create_uuid } from '../../shared/utils/uuid';
import { create_domain_error } from '../../shared/errors/domain_error';
import { get_iso_timestamp } from '../../shared/utils/date_utils';

type CardField = 'word' | 'reading' | 'context' | 'scene' | 'example';

export function create_card(input: CardDraft): Result<CardEntity, Error> {
  const normalized = normalize_fields(input);
  if (!normalized.ok) {
    return normalized;
  }

  const created_at = input.created_at ?? get_iso_timestamp();
  const memory_level = input.memory_level ?? MEMORY_LEVEL_DEFAULT;

  const card: CardEntity = {
    id: create_uuid(),
    ...normalized.data,
    created_at,
    memory_level,
    review_count: 0,
    last_reviewed_at: undefined,
  };

  return create_success_result(card);
}

export function update_card(existing: CardEntity, patch: CardDraft): Result<CardEntity, Error> {
  const normalized = normalize_fields(patch);
  if (!normalized.ok) {
    return normalized;
  }

  const memory_level = patch.memory_level ?? existing.memory_level;
  const created_at = patch.created_at ?? existing.created_at;

  const updated_card: CardEntity = {
    ...existing,
    ...normalized.data,
    memory_level,
    created_at,
  };

  return create_success_result(updated_card);
}

function normalize_fields(
  draft: CardDraft,
): Result<
  Pick<CardEntity, 'word' | 'reading' | 'context' | 'scene' | 'example'>,
  Error
> {
  const required_fields: Array<CardField> = ['word', 'reading', 'context', 'scene', 'example'];
  const normalized: Partial<Record<CardField, string>> = {};

  for (const field of required_fields) {
    const value = draft[field];
    if (typeof value !== 'string') {
      return create_failure_result(
        create_domain_error(`card_factory.${field}_missing`, `Field "${field}" is required.`),
      );
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return create_failure_result(
        create_domain_error(`card_factory.${field}_empty`, `Field "${field}" must not be empty.`),
      );
    }
    normalized[field] = trimmed;
  }

  return create_success_result({
    word: normalized.word!,
    reading: normalized.reading!,
    context: normalized.context!,
    scene: normalized.scene!,
    example: normalized.example!,
  });
}
