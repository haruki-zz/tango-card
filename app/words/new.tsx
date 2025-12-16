import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AddWordForm } from "@/app/features/words/components/AddWordForm";
import {
  DatabaseConnection,
  openDatabase,
} from "@/app/lib/db";

export default function NewWordScreen() {
  const [db, setDb] = useState<DatabaseConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openDatabase()
      .then(setDb)
      .catch((err: Error) => {
        setError(err.message || "本地数据库初始化失败");
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>无法加载本地数据库</Text>
        <Text style={styles.subtle}>{error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.subtle}>正在加载本地数据库…</Text>
      </View>
    );
  }

  return <AddWordForm db={db} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  error: {
    color: "#b91c1c",
    fontSize: 16,
    fontWeight: "700",
  },
  subtle: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
  },
});
