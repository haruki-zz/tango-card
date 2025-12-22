import type { HeatmapActivityRange } from '../../../shared/apiTypes';

export type HeatmapMode = 'words' | 'reviews';

export interface HeatmapCell {
  date: number;
  count: number;
  level: number;
  isFuture: boolean;
}

export function getIntensityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 15) return 3;
  return 4;
}

export function buildHeatmapCells(range: HeatmapActivityRange, mode: HeatmapMode): HeatmapCell[] {
  const sorted = [...range.days].sort((a, b) => a.date - b.date);

  return sorted.map((day) => {
    const count = mode === 'words' ? day.wordsAdded : day.reviewsDone;
    return {
      date: day.date,
      count,
      level: getIntensityLevel(count),
      isFuture: day.date > range.endDate
    };
  });
}

export function chunkIntoWeeks(cells: HeatmapCell[]): HeatmapCell[][] {
  const weeks: HeatmapCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function buildMonthLabels(weeks: HeatmapCell[][]): string[] {
  let lastMonth: number | null = null;

  return weeks.map((week) => {
    const anchor = week.find((cell) => !cell.isFuture) ?? week[0];
    if (!anchor) return '';

    const month = new Date(anchor.date * 1000).getUTCMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      return `${month + 1}月`;
    }
    return '';
  });
}

export function sumByMode(range: HeatmapActivityRange | null, mode: HeatmapMode): number {
  if (!range) return 0;
  return range.days.reduce(
    (sum, day) => sum + (mode === 'words' ? day.wordsAdded : day.reviewsDone),
    0
  );
}
