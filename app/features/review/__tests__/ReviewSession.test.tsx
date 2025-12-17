import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import { ReviewSession } from "../components/ReviewSession";
import { buildReviewQueue } from "../services/reviewQueue";
import {
  insertWord,
  listActivityLogs,
  listReviewEventsByWord,
  listWords,
  openDatabase,
  DatabaseConnection,
} from "@/app/lib/db";
import { appStore } from "@/app/lib/state";
import {
  Familiarity,
  WordEntry,
} from "@/app/lib/types";

jest.mock("expo-sqlite");

describe("ReviewSession", () => {
  let db: DatabaseConnection;
  const clock = () => new Date("2024-06-01T09:30:00.000Z");
  const timestamp = clock().toISOString();

  const createWord = async (id: string, familiarity: Familiarity) =>
    insertWord(
      db,
      {
        id,
        surface: `単語-${id}`,
        reading: `よみ-${id}`,
        meaningZh: `释义-${id}`,
        exampleJa: `例句-${id}`,
        familiarity,
        reviewCount: 1,
        lastReviewedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      timestamp,
    );

  const mapById = (words: WordEntry[]) =>
    words.reduce<Record<string, WordEntry>>((acc, word) => {
      acc[word.id] = word;
      return acc;
    }, {});

  beforeEach(async () => {
    db = await openDatabase(":memory:");
    appStore.getState().reset();
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it("执行熟悉/不熟/跳过并更新熟悉度、计数与事件", async () => {
    await createWord("one", "unfamiliar");
    await createWord("two", "familiar");
    await createWord("three", "unfamiliar");

    const words = await listWords(db);
    const wordsById = mapById(words);
    const queue = buildReviewQueue(words, {
      random: () => 0.1,
      batchSize: 3,
    });

    appStore.getState().setWords(words);
    appStore.getState().setReviewQueue(queue);

    const surfaces = queue.map((id) => wordsById[id].surface);

    const { getByTestId, getByText, getAllByText, findByText } = render(
      <ReviewSession db={db} clock={clock} />,
    );

    const pressCard = () => fireEvent.press(getByTestId("word-card-pressable"));

    await waitFor(() => expect(getAllByText(surfaces[0]).length).toBeGreaterThan(0));
    pressCard();
    fireEvent.press(getByText("熟悉"));

    await waitFor(() => expect(getAllByText(surfaces[1]).length).toBeGreaterThan(0));
    pressCard();
    fireEvent.press(getByText("不熟"));

    await waitFor(() => expect(getAllByText(surfaces[2]).length).toBeGreaterThan(0));
    pressCard();
    fireEvent.press(getByText("跳过"));

    await waitFor(() =>
      expect(getAllByText("本次复习已完成").length).toBeGreaterThan(0),
    );

    const updatedWords = await listWords(db);
    const updatedById = mapById(updatedWords);

    expect(updatedById[queue[0]].familiarity).toBe("familiar");
    expect(updatedById[queue[1]].familiarity).toBe("unfamiliar");
    expect(updatedById[queue[2]].familiarity).toBe(wordsById[queue[2]].familiarity);
    expect(
      Object.values(updatedById).every(
        (word) =>
          word.reviewCount === 2 &&
          word.lastReviewedAt === timestamp &&
          word.updatedAt === timestamp,
      ),
    ).toBe(true);

    const [activityLog] = await listActivityLogs(db);
    expect(activityLog).toMatchObject({
      date: "2024-06-01",
      addCount: 0,
      reviewCount: 3,
    });

    const eventOne = await listReviewEventsByWord(db, queue[0]);
    const eventTwo = await listReviewEventsByWord(db, queue[1]);
    const eventThree = await listReviewEventsByWord(db, queue[2]);

    expect(eventOne).toHaveLength(1);
    expect(eventOne[0].result).toBe("familiar");
    expect(eventTwo).toHaveLength(1);
    expect(eventTwo[0].result).toBe("unfamiliar");
    expect(eventThree).toHaveLength(1);
    expect(eventThree[0].result).toBe(updatedById[queue[2]].familiarity);

    expect(appStore.getState().reviewQueue).toHaveLength(0);
  });

  it("重置队列不增加计数，继续复习仍能前进", async () => {
    await createWord("alpha", "unfamiliar");
    await createWord("beta", "familiar");

    const words = await listWords(db);
    const queue = ["alpha", "beta"];
    appStore.getState().setWords(words);
    appStore.getState().setReviewQueue(queue);

    const { getByText, getByTestId, getAllByText, findByText } = render(
      <ReviewSession db={db} clock={clock} />,
    );

    const pressCard = () => fireEvent.press(getByTestId("word-card-pressable"));

    await waitFor(() => expect(getAllByText("単語-alpha").length).toBeGreaterThan(0));
    pressCard();
    fireEvent.press(getByText("熟悉"));

    await waitFor(() => expect(getAllByText("単語-beta").length).toBeGreaterThan(0));

    let activityLog = await listActivityLogs(db);
    expect(activityLog[0].reviewCount).toBe(1);

    fireEvent.press(getByText("重置本轮"));
    await waitFor(() => expect(getAllByText("単語-alpha").length).toBeGreaterThan(0));

    activityLog = await listActivityLogs(db);
    expect(activityLog[0].reviewCount).toBe(1);

    pressCard();
    fireEvent.press(getByText("跳过"));
    await findByText("単語-beta");
    pressCard();
    fireEvent.press(getByText("不熟"));

    await waitFor(() =>
      expect(getAllByText("本次复习已完成").length).toBeGreaterThan(0),
    );

    activityLog = await listActivityLogs(db);
    expect(activityLog[0].reviewCount).toBe(3);

    const eventsAlpha = await listReviewEventsByWord(db, "alpha");
    expect(eventsAlpha).toHaveLength(2);
  });
});
