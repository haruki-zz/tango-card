import { HEATMAP_WEEK_START } from "@/app/lib/constants";
import { ActivityLog } from "@/app/lib/types";

import {
  HeatmapData,
  HeatmapDay,
  HeatmapRange,
} from "../types";

const toUtcDateOnly = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );

const toDateKey = (date: Date) => toUtcDateOnly(date).toISOString().slice(0, 10);

const ensureDateKey = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("无效的活动日期");
  }
  return toDateKey(parsed);
};

const addDaysUtc = (date: Date, days: number) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );

const startOfWeekUtc = (date: Date) => {
  const weekday = date.getUTCDay();
  const offset = (weekday - HEATMAP_WEEK_START + 7) % 7;
  return addDaysUtc(date, -offset);
};

const startOfMonthUtc = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const endOfMonthUtc = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const collectActivityByDate = (logs: ActivityLog[]) => {
  const map = new Map<string, { addCount: number; reviewCount: number }>();

  logs.forEach((log) => {
    const key = ensureDateKey(log.date);
    const current = map.get(key) ?? { addCount: 0, reviewCount: 0 };
    map.set(key, {
      addCount: current.addCount + log.addCount,
      reviewCount: current.reviewCount + log.reviewCount,
    });
  });

  return map;
};

const enumerateDateKeys = (start: Date, end: Date) => {
  const keys: string[] = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    keys.push(toDateKey(cursor));
    cursor = addDaysUtc(cursor, 1);
  }
  return keys;
};

const buildDays = (
  dateKeys: string[],
  activityMap: Map<string, { addCount: number; reviewCount: number }>,
): HeatmapDay[] =>
  dateKeys.map((date) => {
    const activity = activityMap.get(date);
    const addCount = activity?.addCount ?? 0;
    const reviewCount = activity?.reviewCount ?? 0;

    return {
      date,
      addCount,
      reviewCount,
      total: addCount + reviewCount,
    };
  });

export const buildHeatmapData = (
  logs: ActivityLog[],
  range: HeatmapRange,
  referenceDate = new Date(),
): HeatmapData => {
  const normalizedRef = toUtcDateOnly(referenceDate);
  const start =
    range === "week"
      ? startOfWeekUtc(normalizedRef)
      : startOfMonthUtc(normalizedRef);
  const end =
    range === "week"
      ? addDaysUtc(start, 6)
      : endOfMonthUtc(normalizedRef);

  const dateKeys = enumerateDateKeys(start, end);
  const activityByDate = collectActivityByDate(logs);
  const days = buildDays(dateKeys, activityByDate);

  return {
    range,
    startDate: dateKeys[0],
    endDate: dateKeys[dateKeys.length - 1],
    days,
  };
};
