import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { processColor } from "react-native";

import { HEATMAP_COLOR_STOPS } from "../components/HeatmapGrid";
import { HeatmapView } from "../components/HeatmapView";
import {
  HeatmapData,
  HeatmapDay,
  HeatmapRange,
} from "../types";

const buildData = (
  days: HeatmapDay[],
  range: HeatmapRange = "week",
): HeatmapData => ({
  range,
  startDate: days[0]?.date ?? "",
  endDate: days[days.length - 1]?.date ?? "",
  days,
});

const normalizeColor = (value: unknown) => {
  if (typeof value === "object" && value && "payload" in (value as any)) {
    return (value as { payload: number }).payload;
  }
  return value;
};

describe("HeatmapView", () => {
  it("renders stronger colors for higher totals", async () => {
    const loadData = jest.fn().mockResolvedValue({
      data: buildData([
        { date: "2024-06-02", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-03", addCount: 1, reviewCount: 0, total: 1 },
        { date: "2024-06-04", addCount: 2, reviewCount: 3, total: 5 },
        { date: "2024-06-05", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-06", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-07", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-08", addCount: 0, reviewCount: 0, total: 0 },
      ]),
      source: "computed",
    });

    const { getByTestId } = render(<HeatmapView loadData={loadData} />);

    await waitFor(() => {
      expect(loadData).toHaveBeenCalledTimes(1);
    });

    const base = getByTestId("heatmap-cell-2024-06-02");
    const mid = getByTestId("heatmap-cell-2024-06-03");
    const max = getByTestId("heatmap-cell-2024-06-04");

    expect(normalizeColor(base.props.fill)).toBe(
      normalizeColor(processColor(HEATMAP_COLOR_STOPS[0])),
    );
    expect(normalizeColor(mid.props.fill)).toBe(
      normalizeColor(processColor(HEATMAP_COLOR_STOPS[2])),
    );
    expect(normalizeColor(max.props.fill)).toBe(
      normalizeColor(
        processColor(HEATMAP_COLOR_STOPS[HEATMAP_COLOR_STOPS.length - 1]),
      ),
    );
  });

  it("shows detail panel after tapping a day", async () => {
    const loadData = jest.fn().mockResolvedValue({
      data: buildData([
        { date: "2024-06-02", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-03", addCount: 1, reviewCount: 2, total: 3 },
        { date: "2024-06-04", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-05", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-06", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-07", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-08", addCount: 0, reviewCount: 0, total: 0 },
      ]),
      source: "computed",
    });

    const { getByTestId } = render(<HeatmapView loadData={loadData} />);

    await waitFor(() => {
      expect(getByTestId("heatmap-cell-2024-06-03")).toBeTruthy();
    });

    fireEvent.press(getByTestId("heatmap-cell-2024-06-03"));

    expect(getByTestId("heatmap-detail-date").props.children).toBe(
      "2024-06-03",
    );
    expect(getByTestId("heatmap-detail-add").props.children).toBe(1);
    expect(getByTestId("heatmap-detail-review").props.children).toBe(2);
    expect(getByTestId("heatmap-detail-total").props.children).toBe(3);
  });

  it("reloads data when switching range", async () => {
    const weekData = buildData(
      [
        { date: "2024-06-02", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-03", addCount: 1, reviewCount: 0, total: 1 },
        { date: "2024-06-04", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-05", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-06", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-07", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-06-08", addCount: 0, reviewCount: 0, total: 0 },
      ],
      "week",
    );
    const monthData = buildData(
      [
        { date: "2024-07-01", addCount: 2, reviewCount: 1, total: 3 },
        { date: "2024-07-02", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-03", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-04", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-05", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-06", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-07", addCount: 0, reviewCount: 0, total: 0 },
        { date: "2024-07-08", addCount: 0, reviewCount: 0, total: 0 },
      ],
      "month",
    );

    const loadData = jest
      .fn()
      .mockImplementation((range: HeatmapRange) =>
        Promise.resolve({
          data: range === "week" ? weekData : monthData,
          source: "computed",
        }),
      );

    const { getByText, getByTestId } = render(
      <HeatmapView loadData={loadData} />,
    );

    await waitFor(() => {
      expect(loadData).toHaveBeenCalledWith("week");
    });

    fireEvent.press(getByText("月视图"));

    await waitFor(() => {
      expect(loadData).toHaveBeenCalledWith("month");
    });

    await waitFor(() => {
      expect(getByTestId("heatmap-detail-date").props.children).toBe(
        "2024-07-01",
      );
    });
  });
});
