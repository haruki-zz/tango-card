import type {
  CardIngestRequest,
  CardExportRequest,
  RendererApi,
  ReviewQueueRequest,
  ReviewUpdateRequest,
} from '../../shared/ipc/contracts';
import type { CardEntity } from '../../domain/card/card_entity';
import { WeightedMemoryReviewPolicy } from '../../domain/review/review_policy';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';
import type { ActivitySnapshot, DailyActivityPoint } from '../../domain/analytics/activity_snapshot';

declare global {
  interface Window {
    tango_api?: RendererApi;
  }
}

interface ReviewRecord {
  readonly card_id: string;
  readonly reviewed_at: string;
  readonly memory_level: MemoryLevel;
}

const weighted_policy = new WeightedMemoryReviewPolicy();
const in_memory_cards: Map<string, CardEntity> = new Map();
const review_records: ReviewRecord[] = [];

function create_identifier(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function sanitize_svg(svg_source: string): string {
  const trimmed = svg_source.trim();
  if (!trimmed) {
    throw new Error('SVG source must not be empty.');
  }
  return trimmed;
}

function normalize_tags(tags: string[] | undefined): string[] {
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

function clone_card(card: CardEntity): CardEntity {
  return { ...card, tags: [...card.tags] };
}

function compute_analytics_snapshot(): ActivitySnapshot {
  const points_by_date = new Map<string, DailyActivityPoint>();

  in_memory_cards.forEach((card) => {
    const day = card.created_at.slice(0, 10);
    if (!points_by_date.has(day)) {
      points_by_date.set(day, { date: day, created_cards: 0, reviewed_cards: 0 });
    }
    const entry = points_by_date.get(day);
    if (entry) {
      points_by_date.set(day, {
        ...entry,
        created_cards: entry.created_cards + 1,
      });
    }
  });

  review_records.forEach((record) => {
    const day = record.reviewed_at.slice(0, 10);
    if (!points_by_date.has(day)) {
      points_by_date.set(day, { date: day, created_cards: 0, reviewed_cards: 0 });
    }
    const entry = points_by_date.get(day);
    if (entry) {
      points_by_date.set(day, {
        ...entry,
        reviewed_cards: entry.reviewed_cards + 1,
      });
    }
  });

  const points = Array.from(points_by_date.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );

  const total_cards = in_memory_cards.size;
  const total_reviews = review_records.length;
  const streak_days = calculate_streak(points);

  return {
    streak_days,
    total_cards,
    total_reviews,
    points,
  };
}

function calculate_streak(points: DailyActivityPoint[]): number {
  if (points.length === 0) {
    return 0;
  }

  const activity_days = new Set(points.map((point) => point.date));
  const today = new Date();
  let streak = 0;

  for (;;) {
    const date_key = today.toISOString().slice(0, 10);
    if (!activity_days.has(date_key)) {
      break;
    }
    streak += 1;
    today.setDate(today.getDate() - 1);
  }

  return streak;
}

const fallback_api: RendererApi = {
  async ingest_card(payload: CardIngestRequest) {
    const sanitized_svg = sanitize_svg(payload.svg_source);
    const tags = normalize_tags(payload.tags);
    const memory_level = payload.memory_level ?? MEMORY_LEVEL_DEFAULT;
    const created_at = payload.created_at ?? new Date().toISOString();

    if (payload.card_id && in_memory_cards.has(payload.card_id)) {
      const existing = in_memory_cards.get(payload.card_id)!;
      const updated_card: CardEntity = {
        ...existing,
        svg_source: sanitized_svg,
        tags,
        memory_level,
        created_at,
      };
      in_memory_cards.set(updated_card.id, updated_card);
      return clone_card(updated_card);
    }

    const new_card: CardEntity = {
      id: create_identifier(),
      svg_source: sanitized_svg,
      created_at,
      tags,
      memory_level,
      review_count: 0,
      last_reviewed_at: undefined,
    };
    in_memory_cards.set(new_card.id, new_card);
    return clone_card(new_card);
  },

  async list_cards() {
    return Array.from(in_memory_cards.values()).map(clone_card);
  },

  async fetch_review_queue(request?: ReviewQueueRequest) {
    const cards = Array.from(in_memory_cards.values());
    return weighted_policy.generate_review_queue(cards, request?.size);
  },

  async update_review(payload: ReviewUpdateRequest) {
    const card = in_memory_cards.get(payload.card_id);
    if (!card) {
      throw new Error(`Card ${payload.card_id} not found.`);
    }

    const updated = weighted_policy.update_memory_level(card, payload.memory_level);
    in_memory_cards.set(payload.card_id, updated);

    review_records.push({
      card_id: payload.card_id,
      reviewed_at: updated.last_reviewed_at ?? new Date().toISOString(),
      memory_level: payload.memory_level,
    });

    return clone_card(updated);
  },

  async fetch_analytics_snapshot() {
    return compute_analytics_snapshot();
  },

  async export_cards(_request: CardExportRequest) {
    return {
      status: 'error' as const,
      message: '卡片导出仅支持在 Electron 环境中执行。',
    };
  },

  async import_cards() {
    return {
      status: 'error' as const,
      message: '卡片导入仅支持在 Electron 环境中执行。',
    };
  },
};

export function reset_renderer_api_mock(): void {
  in_memory_cards.clear();
  review_records.splice(0, review_records.length);
}

export function get_renderer_api(): RendererApi {
  if (typeof window !== 'undefined' && window.tango_api) {
    return window.tango_api;
  }

  if (typeof console !== 'undefined') {
    console.warn(
      'Renderer API bridge is unavailable; falling back to in-memory mock for browser preview.',
    );
  }

  return fallback_api;
}
