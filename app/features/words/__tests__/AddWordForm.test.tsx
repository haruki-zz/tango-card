import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AddWordForm } from "@/app/features/words/components/AddWordForm";
import {
  listActivityLogs,
  listAllSyncQueueItems,
  listWords,
  openDatabase,
  DatabaseConnection,
} from "@/app/lib/db";
import type { AiGenerationResponse } from "@/app/lib/api/aiGenerator";
import { appStore } from "@/app/lib/state";

jest.mock("expo-sqlite");

describe("AddWordForm", () => {
  let db: DatabaseConnection;
  const fixedClock = () => new Date("2024-05-06T12:00:00.000Z");

  const buildGenerator = (response: AiGenerationResponse) => ({
    generate: jest.fn(async () => response),
  });

  beforeEach(async () => {
    db = await openDatabase(":memory:");
    appStore.getState().reset();
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it("阻止空内容保存并提示错误", async () => {
    const generator = buildGenerator({
      status: "fallback",
      reason: "skip",
      editableDraft: { reading: "", meaningZh: "", exampleJa: "" },
      canRetry: true,
    });

    const { getByText, findByText } = render(
      <AddWordForm db={db} clock={fixedClock} generator={generator} />,
    );

    fireEvent.press(getByText("保存"));

    expect(
      await findByText("请填写完整信息后再保存"),
    ).toBeTruthy();
    expect(await listWords(db)).toHaveLength(0);
  });

  it("触发 AI 生成并填充结果", async () => {
    const generator = buildGenerator({
      status: "success",
      data: {
        reading: "たんご",
        meaningZh: "单词",
        exampleJa: "例句",
        model: "mock-model",
      },
    });

    const {
      getByText,
      getByPlaceholderText,
      findByDisplayValue,
      getByLabelText,
    } = render(
      <AddWordForm db={db} clock={fixedClock} generator={generator} />,
    );

    fireEvent.changeText(getByPlaceholderText("输入词面"), "  単語  ");
    fireEvent.press(getByLabelText("AI 生成按钮"));

    await waitFor(() => expect(generator.generate).toHaveBeenCalledTimes(1));
    expect(generator.generate).toHaveBeenCalledWith({ surface: "単語" });

    expect(await findByDisplayValue("たんご")).toBeTruthy();
    expect(await findByDisplayValue("单词")).toBeTruthy();
    expect(await findByDisplayValue("例句")).toBeTruthy();
  });

  it("保存编辑后的单词并写入同步队列与活跃度", async () => {
    const generator = buildGenerator({
      status: "success",
      data: {
        reading: "たんご",
        meaningZh: "AI 释义",
        exampleJa: "AI 例句",
        model: "mock-model",
      },
    });

    const {
      getByText,
      getByPlaceholderText,
      findByText,
      getByLabelText,
    } = render(
      <AddWordForm db={db} clock={fixedClock} generator={generator} />,
    );

    fireEvent.changeText(getByPlaceholderText("输入词面"), "単語");
    fireEvent.press(getByLabelText("AI 生成按钮"));
    await waitFor(() => expect(generator.generate).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText("中文释义"), "自定义释义");
    fireEvent.press(getByText("不熟"));
    fireEvent.press(getByText("保存"));

    expect(
      await findByText("保存成功，可继续添加下一个单词"),
    ).toBeTruthy();

    const words = await listWords(db);
    expect(words).toHaveLength(1);
    expect(words[0].meaningZh).toBe("自定义释义");
    expect(words[0].familiarity).toBe("unfamiliar");
    expect(words[0].reviewCount).toBe(1);
    expect(words[0].lastReviewedAt).toBe(words[0].createdAt);

    const [log] = await listActivityLogs(db);
    expect(log).toMatchObject({
      date: "2024-05-06",
      addCount: 1,
      reviewCount: 0,
    });

    const queueItems = await listAllSyncQueueItems(db);
    expect(queueItems).toHaveLength(1);
    expect(queueItems[0].entityType).toBe("word");
    expect(queueItems[0].entityId).toBe(words[0].id);
  });
});
