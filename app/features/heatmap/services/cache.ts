import AsyncStorage from "@react-native-async-storage/async-storage";

import { HEATMAP_CACHE_TTL_MS } from "@/app/lib/constants";

import { HeatmapData, HeatmapRange } from "../types";

const CACHE_VERSION = 1;
const CACHE_KEY_PREFIX = "heatmap-cache";

interface CachePayload {
  version: number;
  cachedAt: number;
  data: HeatmapData;
}

export interface HeatmapCacheStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
}

const cacheKey = (range: HeatmapRange) => `${CACHE_KEY_PREFIX}:${range}`;

const removeIfSupported = async (
  storage: HeatmapCacheStorage,
  range: HeatmapRange,
) => {
  if (storage.removeItem) {
    await storage.removeItem(cacheKey(range));
  }
};

export const writeHeatmapCache = async (
  range: HeatmapRange,
  data: HeatmapData,
  options?: { storage?: HeatmapCacheStorage; nowMs?: number },
) => {
  const storage = options?.storage ?? AsyncStorage;
  const cachedAt = options?.nowMs ?? Date.now();
  const payload: CachePayload = {
    version: CACHE_VERSION,
    cachedAt,
    data,
  };

  await storage.setItem(cacheKey(range), JSON.stringify(payload));
};

export const readHeatmapCache = async (
  range: HeatmapRange,
  options?: { storage?: HeatmapCacheStorage; nowMs?: number },
): Promise<HeatmapData | null> => {
  const storage = options?.storage ?? AsyncStorage;
  const nowMs = options?.nowMs ?? Date.now();

  try {
    const raw = await storage.getItem(cacheKey(range));
    if (!raw) {
      return null;
    }

    const payload = JSON.parse(raw) as CachePayload;
    if (payload.version !== CACHE_VERSION) {
      await removeIfSupported(storage, range);
      return null;
    }

    if (nowMs - payload.cachedAt > HEATMAP_CACHE_TTL_MS) {
      await removeIfSupported(storage, range);
      return null;
    }

    if (payload.data.range !== range) {
      await removeIfSupported(storage, range);
      return null;
    }

    return payload.data;
  } catch (error) {
    await removeIfSupported(storage, range);
    return null;
  }
};

export const clearHeatmapCache = async (
  range: HeatmapRange,
  storage?: HeatmapCacheStorage,
) => removeIfSupported(storage ?? AsyncStorage, range);
