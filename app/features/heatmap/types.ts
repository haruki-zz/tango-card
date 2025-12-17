export type HeatmapRange = "week" | "month";

export interface HeatmapDay {
  date: string;
  addCount: number;
  reviewCount: number;
  total: number;
}

export interface HeatmapData {
  range: HeatmapRange;
  startDate: string;
  endDate: string;
  days: HeatmapDay[];
}

export type HeatmapDataSource = "computed" | "cache";
