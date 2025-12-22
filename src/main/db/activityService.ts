import { and, asc, gte, lte } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { HeatmapActivityDay, HeatmapActivityRange } from '../../shared/apiTypes';
import { dailyActivity, schema } from './schema';
import { DAY_SECONDS, startOfUtcDay, startOfUtcWeek } from './timeUtils';

const LOOKBACK_DAYS = 364;

export async function getHeatmapActivity(
  db: BetterSQLite3Database<typeof schema>,
  options: { now?: number } = {}
): Promise<HeatmapActivityRange> {
  const endDate = startOfUtcDay(options.now ?? Math.floor(Date.now() / 1000));
  const startCandidate = endDate - LOOKBACK_DAYS * DAY_SECONDS;
  const startDate = startOfUtcWeek(startCandidate);

  const rows = await db
    .select()
    .from(dailyActivity)
    .where(and(gte(dailyActivity.date, startDate), lte(dailyActivity.date, endDate)))
    .orderBy(asc(dailyActivity.date));

  const totalDays = Math.floor((endDate - startDate) / DAY_SECONDS) + 1;
  const paddedDays = totalDays % 7 === 0 ? totalDays : totalDays + (7 - (totalDays % 7));
  const countsByDate = new Map(rows.map((row) => [row.date, row]));

  const days: HeatmapActivityDay[] = [];
  for (let index = 0; index < paddedDays; index += 1) {
    const date = startDate + index * DAY_SECONDS;
    const row = countsByDate.get(date);
    days.push({
      date,
      wordsAdded: row?.wordsAddedCount ?? 0,
      reviewsDone: row?.reviewsDoneCount ?? 0
    });
  }

  return {
    startDate,
    endDate,
    days
  };
}
