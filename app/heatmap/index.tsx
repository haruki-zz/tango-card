import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { HeatmapView } from "@/app/features/heatmap/components/HeatmapView";
import {
  HeatmapData,
  HeatmapDataSource,
  HeatmapRange,
  getHeatmapData,
} from "@/app/features/heatmap";
import {
  DatabaseConnection,
  listActivityLogs,
  openDatabase,
} from "@/app/lib/db";
import { appStore } from "@/app/lib/state";

type LoadResult = { data: HeatmapData; source: HeatmapDataSource };

export default function HeatmapScreen() {
  const [db, setDb] = useState<DatabaseConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase()
      .then(setDb)
      .catch((err: Error) => {
        setError(err.message || "本地数据库加载失败");
      });
  }, []);

  const loadData = useCallback(
    async (range: HeatmapRange): Promise<LoadResult> => {
      if (!db) {
        throw new Error("数据库尚未准备好");
      }
      const logs = await listActivityLogs(db);
      appStore.getState().setActivityLogs(logs);
      return getHeatmapData(logs, { range });
    },
    [db],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>无法加载热力视图</Text>
        <Text style={styles.subtle}>{error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16a34a" />
        <Text style={styles.subtle}>正在准备本地数据...</Text>
      </View>
    );
  }

  return <HeatmapView loadData={loadData} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  subtle: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
    fontWeight: "700",
  },
});
