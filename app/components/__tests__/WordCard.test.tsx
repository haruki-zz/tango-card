import { act, fireEvent, render } from "@testing-library/react-native";
import { State } from "react-native-gesture-handler";

import { WordCard } from "../WordCard";

const sampleWord = {
  surface: "勉強",
  reading: "べんきょう",
  meaningZh: "学习；用功",
  exampleJa: "毎日少しずつ勉強を続けています。",
};

describe("WordCard", () => {
  it("在翻转前只展示正面内容，翻转后展示释义与例句", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <WordCard word={sampleWord} />,
    );

    expect(getByText(sampleWord.surface)).toBeTruthy();
    expect(getByText(sampleWord.reading)).toBeTruthy();
    expect(queryByText(sampleWord.meaningZh)).toBeNull();

    const front = getByLabelText("卡片正面，点按翻转");
    fireEvent.press(front);

    expect(getByLabelText("卡片背面，点按翻转")).toBeTruthy();
    expect(getByText(sampleWord.meaningZh)).toBeTruthy();
    expect(getByText(sampleWord.exampleJa)).toBeTruthy();
  });

  it("翻转时更新旋转角度样式以驱动动画", () => {
    const { getByLabelText, getByTestId } = render(
      <WordCard word={sampleWord} />,
    );

    expect(getByTestId("word-card-front").props.accessibilityValue.now).toBe(
      0,
    );

    fireEvent.press(getByLabelText("卡片正面，点按翻转"));

    expect(getByTestId("word-card-front").props.accessibilityValue.now).toBe(
      180,
    );
  });

  it("左右滑动超过阈值时触发切卡回调", () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <WordCard word={sampleWord} onSwipe={onSwipe} />,
    );

    const gestureProps = getByTestId("word-card-gesture").props;
    const fireGesture =
      gestureProps.onGestureEvent ?? gestureProps.onGestureHandlerEvent;
    const fireStateChange =
      gestureProps.onHandlerStateChange ??
      gestureProps.onGestureHandlerStateChange;

    expect(typeof fireGesture).toBe("function");
    expect(typeof fireStateChange).toBe("function");
    act(() => {
      fireGesture?.({
        nativeEvent: { translationX: -120 },
      });
      fireStateChange?.({
        nativeEvent: { translationX: -120, state: State.END },
      });
    });

    expect(onSwipe).toHaveBeenCalledWith("left");
  });
});
