import { ActivityLog } from "@/app/lib/types";

import {
  HeatmapData,
  HeatmapDataSource,
  HeatmapRange,
} from "../types";
import { buildHeatmapData } from "./aggregation";
import {
  HeatmapCacheStorage,
  readHeatmapCache,
  writeHeatmapCache,
} from "./cache";

export interface HeatmapDataOptions {
  range: HeatmapRange;
  now?: Date;
  storage?: HeatmapCacheStorage;
}

export const getHeatmapData = async (
  logs: ActivityLog[],
  options: HeatmapDataOptions,
): Promise<{ data: HeatmapData; source: HeatmapDataSource }> => {
  const now = options.now ?? new Date();
  const storage = options.storage;
  const nowMs = now.getTime();

  if (logs.length === 0) {
    const cached = await readHeatmapCache(options.range, { storage, nowMs });
    if (cached) {
      return { data: cached, source: "cache" };
    }
  }

  const data = buildHeatmapData(logs, options.range, now);
  await writeHeatmapCache(options.range, data, { storage, nowMs });

  return { data, source: "computed" };
};
