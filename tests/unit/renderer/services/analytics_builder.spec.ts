import {
  aggregate_activity_totals,
  build_heatmap_cells,
  build_memory_level_distribution,
  resolve_heatmap_value,
} from '../../../../src/renderer_process/services/analytics_builder';
import type { ActivitySnapshot } from '../../../../src/domain/analytics/activity_snapshot';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';

describe('analytics_builder', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-10T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const snapshot: ActivitySnapshot = {
    streak_days: 2,
    total_cards: 5,
    total_reviews: 8,
    points: [
      { date: '2024-03-04T00:00:00.000Z', created_cards: 1, reviewed_cards: 0 },
      { date: '2024-03-07T00:00:00.000Z', created_cards: 2, reviewed_cards: 1 },
      { date: '2024-03-09T00:00:00.000Z', created_cards: 1, reviewed_cards: 3 },
    ],
  };

  it('normalizes heatmap cells and exposes raw metrics', () => {
    const cells = build_heatmap_cells(snapshot);

    expect(cells).toEqual([
      { date: '2024-03-04', created_cards: 1, reviewed_cards: 0 },
      { date: '2024-03-07', created_cards: 2, reviewed_cards: 1 },
      { date: '2024-03-09', created_cards: 1, reviewed_cards: 3 },
    ]);

    expect(resolve_heatmap_value(cells[0], 'total_activity')).toBe(1);
    expect(resolve_heatmap_value(cells[1], 'created_cards')).toBe(2);
    expect(resolve_heatmap_value(cells[2], 'reviewed_cards')).toBe(3);
  });

  it('aggregates activity totals within a rolling window', () => {
    const totals = aggregate_activity_totals(snapshot, 7);
    expect(totals.created_cards).toBe(4);
    expect(totals.reviewed_cards).toBe(4);
  });

  it('computes memory level distribution with percentages', () => {
    const cards = [
      { id: 'a', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.WELL_KNOWN, review_count: 0, last_reviewed_at: undefined },
      { id: 'b', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.SOMEWHAT_FAMILIAR, review_count: 0, last_reviewed_at: undefined },
      { id: 'c', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.NEEDS_REINFORCEMENT, review_count: 0, last_reviewed_at: undefined },
      { id: 'd', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.NEEDS_REINFORCEMENT, review_count: 0, last_reviewed_at: undefined },
    ];

    const distribution = build_memory_level_distribution(cards);
    expect(distribution).toEqual([
      { level: MemoryLevel.WELL_KNOWN, label: '熟知', count: 1, percentage: 25 },
      { level: MemoryLevel.SOMEWHAT_FAMILIAR, label: '不太熟', count: 1, percentage: 25 },
      { level: MemoryLevel.NEEDS_REINFORCEMENT, label: '需要强化', count: 2, percentage: 50 },
    ]);
  });
});
