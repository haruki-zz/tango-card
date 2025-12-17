import { HEATMAP_CACHE_TTL_MS } from "@/app/lib/constants";
import { ActivityLog } from "@/app/lib/types";
import { buildHeatmapData } from "../services/aggregation";
import {
  readHeatmapCache,
  writeHeatmapCache,
} from "../services/cache";
import { getHeatmapData } from "../services/heatmapData";
import { HeatmapData } from "../types";

const createLog = (
  date: string,
  addCount: number,
  reviewCount: number,
): ActivityLog => ({
  date,
  addCount,
  reviewCount,
});

const createMemoryStorage = () => {
  const store: Record<string, string> = {};
  return {
    async getItem(key: string) {
      return store[key] ?? null;
    },
    async setItem(key: string, value: string) {
      store[key] = value;
    },
    async removeItem(key: string) {
      delete store[key];
    },
    snapshot: () => ({ ...store }),
  };
};

describe("buildHeatmapData", () => {
  it("aggregates weekly buckets from Sunday in UTC", () => {
    const logs = [
      createLog("2024-06-02", 1, 0),
      createLog("2024-06-02", 1, 1),
      createLog("2024-06-03", 0, 2),
      createLog("2024-06-08", 1, 1),
      createLog("2024-05-31", 3, 0),
    ];

    const result = buildHeatmapData(
      logs,
      "week",
      new Date("2024-06-06T18:00:00Z"),
    );

    expect(result.startDate).toBe("2024-06-02"); // Sunday
    expect(result.endDate).toBe("2024-06-08"); // Saturday
    expect(result.days).toHaveLength(7);
    expect(result.days.find((day) => day.date === "2024-06-02")).toEqual({
      date: "2024-06-02",
      addCount: 2,
      reviewCount: 1,
      total: 3,
    });
    expect(result.days.find((day) => day.date === "2024-06-03")?.total).toBe(2);
    expect(
      result.days.some((day) => day.date === "2024-05-31"),
    ).toBe(false);
  });

  it("fills entire month range in UTC", () => {
    const result = buildHeatmapData(
      [
        createLog("2024-02-01", 1, 0),
        createLog("2024-02-29", 0, 3),
        createLog("2024-03-01", 2, 2),
      ],
      "month",
      new Date("2024-02-15T12:00:00Z"),
    );

    expect(result.startDate).toBe("2024-02-01");
    expect(result.endDate).toBe("2024-02-29");
    expect(result.days[0]).toEqual({
      date: "2024-02-01",
      addCount: 1,
      reviewCount: 0,
      total: 1,
    });
    expect(result.days[result.days.length - 1]).toEqual({
      date: "2024-02-29",
      addCount: 0,
      reviewCount: 3,
      total: 3,
    });
    expect(result.days.some((day) => day.date === "2024-03-01")).toBe(false);
  });
});

describe("heatmap cache", () => {
  it("prefers cache when logs are unavailable", async () => {
    const storage = createMemoryStorage();
    const baseTime = new Date("2024-01-10T00:00:00Z");
    const { data: cachedData, source } = await getHeatmapData(
      [createLog("2024-01-08", 1, 2)],
      { range: "week", now: baseTime, storage },
    );

    expect(source).toBe("computed");

    const cachedResult = await getHeatmapData([], {
      range: "week",
      now: new Date("2024-01-11T00:00:00Z"),
      storage,
    });

    expect(cachedResult.source).toBe("cache");
    expect(cachedResult.data.days).toEqual(cachedData.days);
  });

  it("expires cached payload after TTL", async () => {
    const storage = createMemoryStorage();
    const generatedAt = new Date("2024-03-05T00:00:00Z").getTime();
    const data: HeatmapData = buildHeatmapData(
      [createLog("2024-03-03", 1, 1)],
      "week",
      new Date(generatedAt),
    );

    await writeHeatmapCache("week", data, {
      storage,
      nowMs: generatedAt,
    });

    const beforeExpiry = await readHeatmapCache("week", {
      storage,
      nowMs: generatedAt + HEATMAP_CACHE_TTL_MS - 500,
    });
    expect(beforeExpiry?.startDate).toBe(data.startDate);

    const afterExpiry = await readHeatmapCache("week", {
      storage,
      nowMs: generatedAt + HEATMAP_CACHE_TTL_MS + 1,
    });
    expect(afterExpiry).toBeNull();
    expect(storage.snapshot()).toEqual({});
  });
});
