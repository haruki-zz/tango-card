import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import {
  incrementActivityLog,
  insertWord,
  openDatabase,
  DatabaseConnection,
} from "@/app/lib/db";
import { appStore } from "@/app/lib/state";
import HomeScreen from "../index";

jest.mock("expo-sqlite");

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

describe("HomeScreen", () => {
  let db: DatabaseConnection | null = null;
  const fixedClock = () => new Date("2024-06-18T10:00:00.000Z");
  const random = () => 0.2;

  const closeDb = async () => {
    if (db) {
      await db.closeAsync();
      db = null;
    }
  };

  beforeEach(async () => {
    mockPush.mockClear();
    appStore.getState().reset();
    await AsyncStorage.clear();
    await closeDb();
  });

  afterEach(async () => {
    await closeDb();
  });

  const withSeededDb = (
    seed: (connection: DatabaseConnection) => Promise<void>,
  ) => async () => {
    db = await openDatabase(":memory:");
    await seed(db);
    return db;
  };

  it("优先展示不熟且复习次数最高的单词", async () => {
    const loader = withSeededDb(async (connection) => {
      await insertWord(
        connection,
        {
          id: "word-1",
          surface: "高频不熟",
          reading: "takai",
          meaningZh: "高频不熟词",
          exampleJa: "例句 A",
          familiarity: "unfamiliar",
          reviewCount: 8,
          lastReviewedAt: "2024-06-10T00:00:00.000Z",
        },
        "2024-06-01T00:00:00.000Z",
      );
      await insertWord(
        connection,
        {
          id: "word-2",
          surface: "低频不熟",
          reading: "hikui",
          meaningZh: "低频不熟词",
          exampleJa: "例句 B",
          familiarity: "unfamiliar",
          reviewCount: 2,
          lastReviewedAt: "2024-06-11T00:00:00.000Z",
        },
        "2024-06-01T00:00:00.000Z",
      );
      await insertWord(
        connection,
        {
          id: "word-3",
          surface: "熟悉单词",
          reading: "nareta",
          meaningZh: "熟悉词",
          exampleJa: "例句 C",
          familiarity: "familiar",
          reviewCount: 10,
          lastReviewedAt: "2024-06-09T00:00:00.000Z",
        },
        "2024-06-01T00:00:00.000Z",
      );
    });

    const { findByText } = render(
      <HomeScreen dbLoader={loader} clock={fixedClock} random={random} />,
    );

    expect(await findByText("高频不熟")).toBeTruthy();
    expect(await findByText("复习 8 次")).toBeTruthy();
  });

  it("在空词库时展示引导与导航按钮", async () => {
    const loader = withSeededDb(async () => {});

    const { findByText, getByText } = render(
      <HomeScreen dbLoader={loader} clock={fixedClock} random={random} />,
    );

    expect(await findByText("词库为空")).toBeTruthy();
    fireEvent.press(getByText("新增单词"));
    expect(mockPush).toHaveBeenLastCalledWith("/words/new");
    fireEvent.press(getByText("开始复习"));
    expect(mockPush).toHaveBeenLastCalledWith("/review");
    fireEvent.press(getByText("查看热力图"));
    expect(mockPush).toHaveBeenLastCalledWith("/heatmap");
  });

  it("计算当月新增与复习次数并展示热力图摘要", async () => {
    const loader = withSeededDb(async (connection) => {
      await incrementActivityLog(connection, "2024-06-01", { addDelta: 2 });
      await incrementActivityLog(connection, "2024-06-15", { reviewDelta: 1 });
      await incrementActivityLog(connection, "2024-05-20", { addDelta: 5 });
    });

    const { findByTestId } = render(
      <HomeScreen dbLoader={loader} clock={fixedClock} random={random} />,
    );

    expect(await findByTestId("monthly-add-count")).toHaveTextContent("2");
    expect(
      await findByTestId("monthly-review-count"),
    ).toHaveTextContent("1");
    expect(await findByTestId("monthly-total-count")).toHaveTextContent("3");
  });

  it("数据库加载失败时提示错误", async () => {
    const loader = async () => {
      throw new Error("打开数据库失败");
    };

    const { findByText } = render(
      <HomeScreen dbLoader={loader} clock={fixedClock} random={random} />,
    );

    expect(await findByText("无法加载首页")).toBeTruthy();
    expect(await findByText("打开数据库失败")).toBeTruthy();
  });
});
