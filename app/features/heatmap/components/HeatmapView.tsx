import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  HeatmapData,
  HeatmapDataSource,
  HeatmapDay,
  HeatmapRange,
} from "../types";
import { HeatmapGrid } from "./HeatmapGrid";

export type HeatmapLoader = (
  range: HeatmapRange,
) => Promise<{ data: HeatmapData; source: HeatmapDataSource }>;

interface HeatmapViewProps {
  loadData: HeatmapLoader;
  initialRange?: HeatmapRange;
  title?: string;
}

export const HeatmapView = ({
  loadData,
  initialRange = "week",
  title = "学习热力图",
}: HeatmapViewProps) => {
  const [range, setRange] = useState<HeatmapRange>(initialRange);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [source, setSource] = useState<HeatmapDataSource | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loadData(range);
        if (cancelled) {
          return;
        }
        setData(result.data);
        setSource(result.source);
        setSelectedDay((current) => {
          const reused = result.data.days.find(
            (day) => day.date === current?.date,
          );
          if (reused) {
            return reused;
          }
          const active =
            result.data.days.find((day) => day.total > 0) ??
            result.data.days[0] ??
            null;
          return active;
        });
      } catch (caught) {
        if (cancelled) {
          return;
        }
        const err = caught as Error;
        setError(err.message || "热力图加载失败");
        setData(null);
        setSource(null);
        setSelectedDay(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [loadData, range]);

  const handleSelect = (day: HeatmapDay) => {
    setSelectedDay(day);
  };

  const renderRangeSwitcher = () => (
    <View style={styles.segment}>
      {(["week", "month"] as HeatmapRange[]).map((option, index) => {
        const active = option === range;
        const label = option === "week" ? "周视图" : "月视图";
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setRange(option)}
            style={[
              styles.segmentButton,
              index === 0 && styles.segmentButtonLeft,
              index === 1 && styles.segmentButtonRight,
              active && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                active && styles.segmentTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderDetail = () => {
    if (!selectedDay) {
      return (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>每日详情</Text>
          <Text style={styles.placeholder}>请选择一个日期查看详情</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>每日详情</Text>
        <Text
          style={styles.detailDate}
          testID="heatmap-detail-date"
        >
          {selectedDay.date}
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>新增</Text>
          <Text
            style={styles.detailValue}
            testID="heatmap-detail-add"
          >
            {selectedDay.addCount}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>复习</Text>
          <Text
            style={styles.detailValue}
            testID="heatmap-detail-review"
          >
            {selectedDay.reviewCount}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>总计</Text>
          <Text
            style={styles.detailValue}
            testID="heatmap-detail-total"
          >
            {selectedDay.total}
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#16a34a" />
          <Text style={styles.placeholder}>正在加载热力图...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      );
    }

    if (!data) {
      return (
        <View style={styles.center}>
          <Text style={styles.placeholder}>暂无活跃度数据</Text>
        </View>
      );
    }

    return (
      <>
        <HeatmapGrid
          data={data}
          onSelectDay={handleSelect}
          selectedDate={selectedDay?.date}
          style={styles.grid}
        />
        {renderDetail()}
        {source ? (
          <Text style={styles.source}>
            {source === "cache"
              ? "数据来自缓存，适合离线查看"
              : "数据已按最新记录计算"}
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {renderRangeSwitcher()}
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    overflow: "hidden",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  segmentButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  segmentButtonRight: {},
  segmentButtonActive: {
    backgroundColor: "#dcfce7",
  },
  segmentText: {
    color: "#334155",
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#15803d",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
  },
  placeholder: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  grid: {
    alignSelf: "center",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  detailDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803d",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: "#475569",
    fontWeight: "600",
  },
  detailValue: {
    color: "#0f172a",
    fontWeight: "800",
  },
  source: {
    color: "#475569",
    fontSize: 12,
  },
});
