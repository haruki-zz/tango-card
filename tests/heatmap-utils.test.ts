import { describe, expect, it } from 'vitest';
import type { HeatmapActivityRange } from '../src/shared/apiTypes';
import {
  buildHeatmapCells,
  chunkIntoWeeks,
  getIntensityLevel,
  sumByMode
} from '../src/renderer/features/heatmap/heatmapUtils';

describe('heatmap utils', () => {
  it('maps counts to intensity levels and future markers', () => {
    const range: HeatmapActivityRange = {
      startDate: 0,
      endDate: 2,
      days: [
        { date: 2, wordsAdded: 7, reviewsDone: 8 },
        { date: 0, wordsAdded: 0, reviewsDone: 0 },
        { date: 3, wordsAdded: 16, reviewsDone: 1 },
        { date: 1, wordsAdded: 3, reviewsDone: 5 }
      ]
    };

    const wordCells = buildHeatmapCells(range, 'words');
    expect(wordCells.map((cell) => cell.date)).toEqual([0, 1, 2, 3]);
    expect(wordCells.map((cell) => cell.level)).toEqual([0, 1, 2, 4]);
    expect(wordCells[3].isFuture).toBe(true);

    const reviewCells = buildHeatmapCells(range, 'reviews');
    expect(reviewCells[1].level).toBe(2);
    expect(reviewCells[2].level).toBe(3);
    expect(sumByMode(range, 'reviews')).toBe(14);

    const weeks = chunkIntoWeeks(wordCells);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toHaveLength(4);
  });

  it('calculates thresholds directly', () => {
    expect(getIntensityLevel(0)).toBe(0);
    expect(getIntensityLevel(1)).toBe(1);
    expect(getIntensityLevel(4)).toBe(2);
    expect(getIntensityLevel(10)).toBe(3);
    expect(getIntensityLevel(24)).toBe(4);
  });
});
