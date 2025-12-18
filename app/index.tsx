import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { WordCard } from "@/app/components/WordCard";
import {
  HeatmapData,
  HeatmapDataSource,
  HeatmapGrid,
  getHeatmapData,
} from "@/app/features/heatmap";
import {
  RandomFn,
  selectFeaturedWord,
} from "@/app/features/home/services/selectFeaturedWord";
import {
  DatabaseConnection,
  listActivityLogs,
  listWords,
  openDatabase,
} from "@/app/lib/db";
import { appStore, useAppStore } from "@/app/lib/state";
import { WordEntry } from "@/app/lib/types";

const defaultClock = () => new Date();

interface HomeScreenProps {
  dbLoader?: () => Promise<DatabaseConnection>;
  clock?: () => Date;
  random?: RandomFn;
}

export default function HomeScreen({
  dbLoader = openDatabase,
  clock = defaultClock,
  random = Math.random,
}: HomeScreenProps) {
  const router = useRouter();
  const wordsById = useAppStore((state) => state.wordsById);
  const activityByDate = useAppStore((state) => state.activityByDate);
  const words = useMemo(
    () => Object.values(wordsById),
    [wordsById],
  );
  const activityLogs = useMemo(
    () => Object.values(activityByDate),
    [activityByDate],
  );

  const [db, setDb] = useState<DatabaseConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredWord, setFeaturedWord] = useState<WordEntry | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapSource, setHeatmapSource] =
    useState<HeatmapDataSource | null>(null);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const connection = await dbLoader();
        if (cancelled) {
          return;
        }
        setDb(connection);
        const [wordList, logs] = await Promise.all([
          listWords(connection),
          listActivityLogs(connection),
        ]);
        if (cancelled) {
          return;
        }
        const { setWords, setActivityLogs } = appStore.getState();
        setWords(wordList);
        setActivityLogs(logs);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        const err = caught as Error;
        setError(err.message || "首页数据加载失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [dbLoader]);

  useEffect(() => {
    setFeaturedWord(selectFeaturedWord(words, random));
  }, [words, random]);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    const computeHeatmap = async () => {
      setHeatmapLoading(true);
      setHeatmapError(null);
      try {
        const result = await getHeatmapData(activityLogs, {
          range: "month",
          now: clock(),
        });
        if (cancelled) {
          return;
        }
        setHeatmapData(result.data);
        setHeatmapSource(result.source);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        const err = caught as Error;
        setHeatmapError(err.message || "当月活跃度加载失败");
        setHeatmapData(null);
        setHeatmapSource(null);
      } finally {
        if (!cancelled) {
          setHeatmapLoading(false);
        }
      }
    };

    void computeHeatmap();

    return () => {
      cancelled = true;
    };
  }, [activityLogs, clock, loading]);

  const monthSummary = useMemo(() => {
    if (!heatmapData) {
      return { add: 0, review: 0 };
    }
    return heatmapData.days.reduce(
      (acc, day) => ({
        add: acc.add + day.addCount,
        review: acc.review + day.reviewCount,
      }),
      { add: 0, review: 0 },
    );
  }, [heatmapData]);

  const formatDate = (value?: string) =>
    value ? value.slice(0, 10) : "未复习";

  const goToNewWord = () => router.push("/words/new");
  const goToReview = () => router.push("/review");
  const goToHeatmap = () => router.push("/heatmap");

  const renderHero = () => (
    <View style={styles.hero}>
      <Text style={styles.title}>Tango Card</Text>
      <Text style={styles.subtitle}>随时新增、复习并追踪每日学习进度</Text>
    </View>
  );

  const renderFeaturedCard = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>推荐记忆卡</Text>
        {words.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setFeaturedWord(selectFeaturedWord(words, random))}
          >
            <Text style={styles.link}>换一张</Text>
          </Pressable>
        ) : null}
      </View>
      {featuredWord ? (
        <View style={styles.cardWrapper}>
          <WordCard word={featuredWord} style={styles.wordCard} />
          <View style={styles.wordMeta} testID="home-featured-word">
            <View
              style={[
                styles.familiarityBadge,
                featuredWord.familiarity === "unfamiliar"
                  ? styles.unfamiliarBadge
                  : styles.familiarBadge,
              ]}
            >
              <Text style={styles.badgeText}>
                {featuredWord.familiarity === "unfamiliar" ? "不熟" : "熟悉"}
              </Text>
            </View>
            <Text style={styles.metaText}>
              复习 {featuredWord.reviewCount} 次
            </Text>
            <Text style={styles.metaText}>
              最近复习 {formatDate(featuredWord.lastReviewedAt)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard} testID="home-empty-state">
          <Text style={styles.emptyTitle}>词库为空</Text>
          <Text style={styles.subtle}>
            添加首个单词后，这里会随机展示待复习的卡片。
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={goToNewWord}
          >
            <Text style={styles.primaryButtonText}>去新增</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>快捷入口</Text>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.primaryAction]}
          onPress={goToNewWord}
        >
          <Text style={styles.actionTitle}>新增单词</Text>
          <Text style={styles.actionSubtitle}>录入新词并生成释义</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={goToReview}
        >
          <Text style={styles.actionTitle}>开始复习</Text>
          <Text style={styles.actionSubtitle}>抽取 30 条卡片快速标记</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.ghostAction]}
          onPress={goToHeatmap}
        >
          <Text style={styles.actionTitle}>查看热力图</Text>
          <Text style={styles.actionSubtitle}>总览每日新增与复习</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderHeatmapPreview = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>当月活跃度</Text>
        <Pressable
          accessibilityRole="button"
          onPress={goToHeatmap}
        >
          <Text style={styles.link}>查看完整热力图</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={goToHeatmap}
        style={styles.previewCard}
      >
        {heatmapLoading ? (
          <View style={styles.previewCenter}>
            <ActivityIndicator color="#16a34a" />
            <Text style={styles.subtle}>正在加载当月活跃度...</Text>
          </View>
        ) : heatmapError ? (
          <View style={styles.previewCenter}>
            <Text style={styles.error}>{heatmapError}</Text>
          </View>
        ) : heatmapData ? (
          <>
            <HeatmapGrid
              data={heatmapData}
              style={styles.previewGrid}
            />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>本月新增</Text>
                <Text
                  style={styles.summaryValue}
                  testID="monthly-add-count"
                >
                  {monthSummary.add}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>本月复习</Text>
                <Text
                  style={styles.summaryValue}
                  testID="monthly-review-count"
                >
                  {monthSummary.review}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>总计</Text>
                <Text
                  style={styles.summaryValue}
                  testID="monthly-total-count"
                >
                  {monthSummary.add + monthSummary.review}
                </Text>
              </View>
            </View>
            {heatmapSource ? (
              <Text style={styles.source}>
                {heatmapSource === "cache"
                  ? "数据来自缓存，适合离线查看"
                  : "数据按本地最新记录计算"}
              </Text>
            ) : null}
          </>
        ) : (
          <View style={styles.previewCenter}>
            <Text style={styles.subtle}>本月暂无学习记录</Text>
          </View>
        )}
      </Pressable>
    </View>
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>无法加载首页</Text>
        <Text style={styles.subtle}>{error}</Text>
      </View>
    );
  }

  if (loading || !db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.subtle}>正在准备本地数据库...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {renderHero()}
      {renderFeaturedCard()}
      {renderActions()}
      {renderHeatmapPreview()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  hero: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#e2e8f0",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  link: {
    color: "#2563eb",
    fontWeight: "700",
  },
  cardWrapper: {
    gap: 12,
  },
  wordCard: {
    minHeight: 260,
  },
  wordMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  familiarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  unfamiliarBadge: {
    backgroundColor: "#fee2e2",
  },
  familiarBadge: {
    backgroundColor: "#dcfce7",
  },
  badgeText: {
    fontWeight: "700",
    color: "#0f172a",
  },
  metaText: {
    color: "#475569",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  actionRow: {
    gap: 10,
  },
  actionButton: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryAction: {
    backgroundColor: "#dbeafe",
    borderColor: "#bfdbfe",
  },
  secondaryAction: {
    backgroundColor: "#ecfeff",
    borderColor: "#bae6fd",
  },
  ghostAction: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  actionSubtitle: {
    color: "#475569",
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  previewCenter: {
    alignItems: "center",
    gap: 6,
  },
  previewGrid: {
    alignSelf: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    color: "#475569",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  source: {
    color: "#475569",
    fontSize: 12,
  },
  error: {
    color: "#b91c1c",
    fontWeight: "700",
  },
});
