import { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

import type { WordEntry } from "@/app/lib/types";

type SwipeDirection = "left" | "right";

interface WordCardProps {
  word: Pick<WordEntry, "surface" | "reading" | "meaningZh" | "exampleJa">;
  onSwipe?: (direction: SwipeDirection) => void;
  onFlip?: (isBack: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

const FLIP_DURATION = 260;
const SWIPE_THRESHOLD = 80;
const SWIPE_OUT_DISTANCE = 260;

export const WordCard = ({
  word,
  onSwipe,
  onFlip,
  style,
}: WordCardProps) => {
  const [isBack, setIsBack] = useState(false);
  const [rotationForTest, setRotationForTest] = useState(0);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);

  const accessibilityLabel = useMemo(
    () =>
      isBack ? "卡片背面，点按翻转" : "卡片正面，点按翻转",
    [isBack],
  );

  const toggleSide = () => {
    const nextSide = !isBack;
    setIsBack(nextSide);
    rotation.value = withTiming(nextSide ? 180 : 0, {
      duration: FLIP_DURATION,
    });
    setRotationForTest(nextSide ? 180 : 0);
    onFlip?.(nextSide);
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      const hasSwiped = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (hasSwiped) {
        const direction: SwipeDirection =
          event.translationX > 0 ? "right" : "left";
        translateX.value = withTiming(
          direction === "right"
            ? SWIPE_OUT_DISTANCE
            : -SWIPE_OUT_DISTANCE,
          { duration: 180 },
          () => {
            translateX.value = withTiming(0, { duration: 160 });
          },
        );
        if (onSwipe) {
          const isJsThread =
            !(globalThis as { _WORKLET?: boolean })._WORKLET;
          if (isJsThread) {
            onSwipe(direction);
          } else {
            runOnJS(onSwipe)(direction);
          }
        }
      } else {
        translateX.value = withSpring(0, {
          damping: 14,
          stiffness: 160,
        });
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotateZ: `${interpolate(
          translateX.value,
          [-160, 0, 160],
          [-5, 0, 5],
          Extrapolate.CLAMP,
        )}deg`,
      },
    ],
  }));

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      rotation.value,
      [0, 90],
      [1, 0],
      Extrapolate.CLAMP,
    ),
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotation.value}deg` },
    ],
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      rotation.value,
      [90, 180],
      [0, 1],
      Extrapolate.CLAMP,
    ),
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotation.value + 180}deg` },
    ],
  }));

  return (
    <PanGestureHandler
      testID="word-card-gesture"
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
      onGestureHandlerEvent={gestureHandler}
      onGestureHandlerStateChange={gestureHandler}
    >
      <Animated.View
        style={[styles.card, cardAnimatedStyle, style]}
        testID="word-card"
      >
        <Pressable
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="点击翻转，左右滑动切换下一张"
          onPress={toggleSide}
          testID="word-card-pressable"
        >
          <Animated.View
            style={[styles.face, frontAnimatedStyle]}
            accessibilityValue={{ now: rotationForTest }}
            testID="word-card-front"
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>正面</Text>
            </View>
            <Text style={styles.surface}>{word.surface}</Text>
            <Text style={styles.reading}>{word.reading}</Text>
            <Text style={styles.hint}>点按翻转，滑动切换</Text>
          </Animated.View>

          <Animated.View
            style={[styles.face, styles.backFace, backAnimatedStyle]}
            accessibilityValue={{ now: rotationForTest }}
            testID="word-card-back"
          >
            {isBack ? (
              <>
                <View style={[styles.badge, styles.badgeBack]}>
                  <Text style={styles.badgeText}>背面</Text>
                </View>
                <View style={styles.header}>
                  <Text style={styles.surface}>{word.surface}</Text>
                  <Text style={styles.reading}>{word.reading}</Text>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>释义</Text>
                  <Text style={styles.body}>{word.meaningZh}</Text>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>例句</Text>
                  <Text style={styles.example}>{word.exampleJa}</Text>
                </View>
              </>
            ) : null}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    minHeight: 260,
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    padding: 20,
    backfaceVisibility: "hidden",
    backgroundColor: "#0f172a",
  },
  backFace: {
    backgroundColor: "#0b253c",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1e3a8a",
    marginBottom: 12,
  },
  badgeBack: {
    backgroundColor: "#075985",
  },
  badgeText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  surface: {
    fontSize: 26,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 6,
  },
  reading: {
    fontSize: 18,
    color: "#cbd5e1",
    marginBottom: 18,
  },
  hint: {
    marginTop: 18,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  header: {
    marginBottom: 12,
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#bae6fd",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 16,
    color: "#e2e8f0",
    lineHeight: 22,
  },
  example: {
    fontSize: 15,
    color: "#cbd5e1",
    lineHeight: 22,
  },
});
