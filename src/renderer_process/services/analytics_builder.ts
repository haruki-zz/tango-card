import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';

export interface HeatmapCell {
  readonly date: string;
  readonly score: number;
}

export function build_heatmap_cells(snapshot: ActivitySnapshot): HeatmapCell[] {
  return snapshot.points.map((point) => ({
    date: point.date,
    score: point.created_cards + point.reviewed_cards,
  }));
}
