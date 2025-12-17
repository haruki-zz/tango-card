import { Fragment } from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { StyleProp, ViewStyle } from "react-native";

import { HeatmapData, HeatmapDay } from "../types";

const CELL_SIZE = 28;
const CELL_GAP = 6;
const COLUMNS = 7;

export const HEATMAP_COLOR_STOPS = [
  "#e2e8f0",
  "#d1fae5",
  "#a7f3d0",
  "#86efac",
  "#4ade80",
  "#16a34a",
  "#166534",
] as const;

const getCellColor = (total: number, maxTotal: number) => {
  if (maxTotal <= 0 || total <= 0) {
    return HEATMAP_COLOR_STOPS[0];
  }
  const buckets = HEATMAP_COLOR_STOPS.length - 1;
  const ratio = total / maxTotal;
  const index = Math.min(
    buckets,
    Math.max(1, Math.ceil(ratio * buckets)),
  );
  return HEATMAP_COLOR_STOPS[index];
};

interface HeatmapGridProps {
  data: HeatmapData;
  onSelectDay?: (day: HeatmapDay) => void;
  selectedDate?: string | null;
  style?: StyleProp<ViewStyle>;
}

export const HeatmapGrid = ({
  data,
  onSelectDay,
  selectedDate,
  style,
}: HeatmapGridProps) => {
  const rows = Math.ceil(data.days.length / COLUMNS);
  const width = COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_GAP;
  const height = rows * CELL_SIZE + (rows - 1) * CELL_GAP;
  const maxTotal = data.days.reduce(
    (max, day) => Math.max(max, day.total),
    0,
  );

  return (
    <Svg
      width={width}
      height={height}
      style={style}
      testID="heatmap-grid"
    >
      {data.days.map((day, index) => {
        const column = index % COLUMNS;
        const row = Math.floor(index / COLUMNS);
        const x = column * (CELL_SIZE + CELL_GAP);
        const y = row * (CELL_SIZE + CELL_GAP);
        const fill = getCellColor(day.total, maxTotal);
        const selected = day.date === selectedDate;
        const dayLabel = day.date.slice(-2);

        return (
          <Fragment key={day.date}>
            <Rect
              x={x}
              y={y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={8}
              ry={8}
              fill={fill}
              stroke={selected ? "#0f172a" : "#cbd5e1"}
              strokeWidth={selected ? 2 : 1}
              onPress={() => onSelectDay?.(day)}
              testID={`heatmap-cell-${day.date}`}
              accessibilityLabel={`日期 ${day.date}，新增 ${day.addCount}，复习 ${day.reviewCount}`}
            />
            <SvgText
              x={x + CELL_SIZE / 2}
              y={y + CELL_SIZE / 2 + 5}
              fill={selected ? "#0f172a" : "#334155"}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
            >
              {dayLabel}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
};
