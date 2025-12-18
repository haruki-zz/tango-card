import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ReviewSession } from "@/app/features/review/components/ReviewSession";
import {
  DatabaseConnection,
  openDatabase,
} from "@/app/lib/db";

export default function ReviewScreen() {
  const [db, setDb] = useState<DatabaseConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase()
      .then(setDb)
      .catch((err: Error) => {
        setError(err.message || "本地数据库加载失败");
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>无法加载复习页面</Text>
        <Text style={styles.subtle}>{error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.subtle}>正在准备本地数据库...</Text>
      </View>
    );
  }

  return <ReviewSession db={db} />;
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
