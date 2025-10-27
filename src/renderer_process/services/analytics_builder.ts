import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { CardEntity } from '../../domain/card/card_entity';
import type { MemoryLevel } from '../../domain/review/memory_level';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';

export type HeatmapMetric = 'total_activity' | 'created_cards' | 'reviewed_cards';

export interface HeatmapCell {
  readonly date: string;
  readonly created_cards: number;
  readonly reviewed_cards: number;
}

export interface ActivityTotals {
  readonly window_days: number;
  readonly created_cards: number;
  readonly reviewed_cards: number;
}

export interface MemoryLevelDistributionEntry {
  readonly level: MemoryLevel;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
}

export function build_heatmap_cells(snapshot: ActivitySnapshot): HeatmapCell[] {
  return snapshot.points.map((point) => ({
    date: normalize_point_date(point.date),
    created_cards: point.created_cards,
    reviewed_cards: point.reviewed_cards,
  }));
}

export function resolve_heatmap_value(cell: HeatmapCell, metric: HeatmapMetric): number {
  switch (metric) {
    case 'created_cards':
      return cell.created_cards;
    case 'reviewed_cards':
      return cell.reviewed_cards;
    case 'total_activity':
    default:
      return cell.created_cards + cell.reviewed_cards;
  }
}

export function aggregate_activity_totals(
  snapshot: ActivitySnapshot,
  window_days: number,
): ActivityTotals {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (window_days - 1));
  const start_of_window = Date.UTC(
    cutoff.getUTCFullYear(),
    cutoff.getUTCMonth(),
    cutoff.getUTCDate(),
  );

  const totals = snapshot.points.reduce<{
    created_cards: number;
    reviewed_cards: number;
  }>(
    (accumulator, point) => {
      const timestamp = Date.parse(point.date);
      if (Number.isNaN(timestamp)) {
        return accumulator;
      }
      if (timestamp < start_of_window) {
        return accumulator;
      }
      return {
        created_cards: accumulator.created_cards + point.created_cards,
        reviewed_cards: accumulator.reviewed_cards + point.reviewed_cards,
      };
    },
    { created_cards: 0, reviewed_cards: 0 },
  );

  return {
    window_days,
    created_cards: totals.created_cards,
    reviewed_cards: totals.reviewed_cards,
  };
}

export function build_memory_level_distribution(
  cards: CardEntity[],
): MemoryLevelDistributionEntry[] {
  const totals = new Map<MemoryLevel, number>();
  cards.forEach((card) => {
    totals.set(card.memory_level, (totals.get(card.memory_level) ?? 0) + 1);
  });
  const total_cards = cards.length;
  return MEMORY_LEVEL_OPTIONS.map((option) => {
    const count = totals.get(option.level) ?? 0;
    const percentage = total_cards === 0 ? 0 : Math.round((count / total_cards) * 100);
    return {
      level: option.level,
      label: option.label,
      count,
      percentage,
    };
  });
}

function normalize_point_date(date: string): string {
  if (date.includes('T')) {
    return date.slice(0, 10);
  }
  return date;
}
