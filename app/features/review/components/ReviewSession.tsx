import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Network from "expo-network";

import { WordCard } from "@/app/components/WordCard";
import { DatabaseConnection } from "@/app/lib/db";
import { appStore, useAppStore } from "@/app/lib/state";
import { WordEntry } from "@/app/lib/types";
import { applyReviewAction, ReviewAction } from "../services/reviewActions";
import { prepareReviewQueue } from "../services/reviewQueue";

interface ReviewSessionProps {
  db: DatabaseConnection;
  clock?: () => Date;
}

const actionMessage: Record<Exclude<ReviewAction, "skip">, string> = {
  familiar: "已标记为熟悉",
  unfamiliar: "已标记为不熟",
};

const EMPTY_QUEUE_MESSAGE = "目前复习队列为空，请添加单词";

export const ReviewSession = ({ db, clock }: ReviewSessionProps) => {
  const queueIds = useAppStore((state) => state.reviewQueue);
  const [currentWord, setCurrentWord] = useState<WordEntry | undefined>();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [networkMessage, setNetworkMessage] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const initialQueueRef = useRef<string[]>([]);

  useEffect(() => {
    const hydrateQueue = async () => {
      if (queueIds.length > 0 || hydratedRef.current) {
        return;
      }
      setLoading(true);
      try {
        const { queue, words } = await prepareReviewQueue(db);
        hydratedRef.current = true;
        if (queue.length === 0 || words.length === 0) {
          setMessage(EMPTY_QUEUE_MESSAGE);
        } else {
          setMessage(null);
        }
      } catch (error) {
        const err = error as Error;
        setMessage(err.message || "加载复习队列失败");
      } finally {
        setLoading(false);
      }
    };

    void hydrateQueue();
  }, [db, queueIds.length]);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (
          state &&
          (state.isConnected === false ||
            state.isInternetReachable === false)
        ) {
          setNetworkMessage("网络不可用，请检查网络设置");
        } else {
          setNetworkMessage(null);
        }
      } catch {
        setNetworkMessage(null);
      }
    };

    void checkNetwork();
  }, []);

  useEffect(() => {
    if (queueIds.length > 0 && !hydratedRef.current) {
      hydratedRef.current = true;
    }

    if (queueIds.length > 0 && initialQueueRef.current.length === 0) {
      initialQueueRef.current = [...queueIds];
    }

    if (!currentWord && queueIds.length > 0) {
      const next = appStore.getState().popNextReviewWord();
      if (next) {
        setCurrentWord(next);
        setHasFlipped(false);
        setMessage(null);
      }
    }

    if (
      !currentWord &&
      queueIds.length === 0 &&
      hydratedRef.current &&
      initialQueueRef.current.length > 0
    ) {
      setMessage("本次复习已完成");
    }
  }, [currentWord, queueIds]);

  const handleReview = async (action: ReviewAction) => {
    if (!currentWord || processing || !hasFlipped) {
      return;
    }
    setProcessing(true);
    try {
      await applyReviewAction({
        db,
        word: currentWord,
        action,
        clock,
      });
      const next = appStore.getState().popNextReviewWord();
      setCurrentWord(next ?? undefined);
      setHasFlipped(false);
      if (next) {
        setMessage(
          action === "skip"
            ? "已跳过并计入复习"
            : actionMessage[action],
        );
      } else {
        setMessage("本次复习已完成");
      }
    } catch (error) {
      const err = error as Error;
      setMessage(err.message || "复习操作失败");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    if (initialQueueRef.current.length === 0) {
      return;
    }
    appStore.getState().setReviewQueue(initialQueueRef.current);
    const next = appStore.getState().popNextReviewWord();
    setCurrentWord(next ?? undefined);
    setHasFlipped(false);
    setMessage("复习队列已重置");
  };

  const renderActions = () => {
    const disabled = processing || !hasFlipped || !currentWord;
    return (
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="标记熟悉"
          style={[styles.actionButton, styles.familiarButton, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => handleReview("familiar")}
        >
          <Text style={styles.actionText}>熟悉</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="标记不熟"
          style={[styles.actionButton, styles.unfamiliarButton, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => handleReview("unfamiliar")}
        >
          <Text style={styles.actionText}>不熟</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="跳过并继续"
          style={[styles.actionButton, styles.skipButton, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => handleReview("skip")}
        >
          <Text style={styles.actionText}>跳过</Text>
        </Pressable>
      </View>
    );
  };

  const totalCount = initialQueueRef.current.length;
  const remaining = queueIds.length;
  const activeWordCount = currentWord ? 1 : 0;
  const completedCount =
    totalCount === 0
      ? 0
      : Math.min(
          totalCount,
          Math.max(0, totalCount - (remaining + activeWordCount)),
        );
  const progressRatio =
    totalCount === 0 ? 0 : Math.min(1, completedCount / totalCount);

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>进度</Text>
        <Text
          style={styles.progressValue}
          testID="review-progress-value"
        >
          {`${completedCount}/${totalCount || 0}`}
        </Text>
      </View>
      <View style={styles.progressBarTrack} accessibilityRole="progressbar">
        <View
          testID="review-progress-bar"
          style={[
            styles.progressBarFill,
            { width: `${progressRatio * 100}%` },
          ]}
        />
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.status}>加载复习队列中...</Text>
        </View>
      );
    }

    if (!currentWord) {
      return (
        <View style={styles.center}>
          <Text style={styles.status}>
            {message ?? EMPTY_QUEUE_MESSAGE}
          </Text>
        </View>
      );
    }

    return (
      <>
        <WordCard
          key={currentWord.id}
          word={currentWord}
          onFlip={(isBack) => setHasFlipped(isBack)}
          style={styles.card}
        />
        <Text style={styles.hint}>
          {hasFlipped ? "请选择熟悉度或跳过" : "请先翻转再标记熟悉度"}
        </Text>
        {renderActions()}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="重置复习队列"
          style={[styles.resetButton, processing && styles.disabled]}
          disabled={processing}
          onPress={handleReset}
        >
          <Text style={styles.resetText}>重置本轮</Text>
        </Pressable>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>复习</Text>
      {renderProgress()}
      {renderContent()}
      {networkMessage ? (
        <Text style={[styles.message, styles.networkWarning]}>
          {networkMessage}
        </Text>
      ) : null}
      {message && message !== EMPTY_QUEUE_MESSAGE ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  card: {
    minHeight: 280,
  },
  hint: {
    textAlign: "center",
    color: "#475569",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  familiarButton: {
    backgroundColor: "#16a34a",
  },
  unfamiliarButton: {
    backgroundColor: "#dc2626",
  },
  skipButton: {
    backgroundColor: "#4b5563",
  },
  resetButton: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  progressContainer: {
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#0f172a",
    fontWeight: "700",
  },
  progressValue: {
    color: "#0f172a",
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 10,
    width: "100%",
    backgroundColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },
  resetText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  status: {
    color: "#334155",
  },
  message: {
    color: "#0f172a",
    backgroundColor: "#e2e8f0",
    padding: 10,
    borderRadius: 10,
  },
  networkWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
});
