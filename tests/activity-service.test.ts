import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/main/db/database';
import { getHeatmapActivity } from '../src/main/db/activityService';
import { schema } from '../src/main/db/schema';
import { DAY_SECONDS, startOfUtcWeek } from '../src/main/db/timeUtils';

describe('getHeatmapActivity', () => {
  it('returns a padded 12-month window with daily counts', async () => {
    const db = initializeDatabase(':memory:');
    const endDate = Math.floor(Date.UTC(2024, 0, 10) / 1000);
    const earlyDay = Math.floor(Date.UTC(2023, 6, 1) / 1000);
    const recentDay = Math.floor(Date.UTC(2024, 0, 9) / 1000);

    try {
      await db.db.insert(schema.dailyActivity).values([
        { date: earlyDay, wordsAddedCount: 2, reviewsDoneCount: 0 },
        { date: recentDay, wordsAddedCount: 1, reviewsDoneCount: 4 }
      ]);

      const activity = await getHeatmapActivity(db.db, { now: endDate });
      const expectedStart = startOfUtcWeek(endDate - 364 * DAY_SECONDS);
      const totalDays = Math.floor((endDate - expectedStart) / DAY_SECONDS) + 1;
      const paddedDays = totalDays % 7 === 0 ? totalDays : totalDays + (7 - (totalDays % 7));

      expect(activity.startDate).toBe(expectedStart);
      expect(activity.endDate).toBe(endDate);
      expect(activity.days).toHaveLength(paddedDays);

      const early = activity.days.find((day) => day.date === earlyDay);
      expect(early?.wordsAdded).toBe(2);

      const recent = activity.days.find((day) => day.date === recentDay);
      expect(recent?.reviewsDone).toBe(4);

      const lastDay = activity.days[activity.days.length - 1];
      expect(lastDay.date).toBe(expectedStart + (paddedDays - 1) * DAY_SECONDS);
      expect(lastDay.date).toBeGreaterThanOrEqual(endDate);
    } finally {
      db.sqlite.close();
    }
  });
});
