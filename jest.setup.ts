import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import { State } from "react-native-gesture-handler";
import { setUpTests as setUpReanimatedTests } from "react-native-reanimated";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

setUpReanimatedTests();

// 补充 Reanimated 模拟中缺失的手势回调与 runOnJS，便于手势相关组件测试
const mockedReanimated = require("react-native-reanimated");
if (!mockedReanimated.useAnimatedGestureHandler) {
  mockedReanimated.useAnimatedGestureHandler = (handlers: any) => {
    const context: Record<string, unknown> = { startX: 0 };
    return (event: { nativeEvent?: any }) => {
      const nativeEvent = event?.nativeEvent ?? event;
      const state = nativeEvent?.state;
      if (state === State.BEGAN) {
        handlers.onStart?.(nativeEvent, context);
      } else if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        handlers.onEnd?.(nativeEvent, context);
      } else {
        handlers.onActive?.(nativeEvent, context);
      }
    };
  };
}
if (!mockedReanimated.runOnJS) {
  mockedReanimated.runOnJS = (fn: unknown) => fn;
}
