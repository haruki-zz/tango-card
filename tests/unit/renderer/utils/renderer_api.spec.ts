import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import { get_renderer_api, reset_renderer_api_mock } from '../../../../src/renderer_process/utils/renderer_api';

describe('renderer_api fallback', () => {
  let console_warn_spy: jest.SpyInstance;

  beforeEach(() => {
    reset_renderer_api_mock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).tango_api;
    console_warn_spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    console_warn_spy.mockRestore();
  });

  it('returns a mock implementation when Electron bridge is missing', async () => {
    const api = get_renderer_api();
    const card = await api.ingest_card({
      word: '学ぶ',
      reading: 'まなぶ',
      context: '朝カフェで新しい単語を学ぶ。',
      scene: 'スケジュールを調整しながらの勉強時間。',
      example: '毎朝30分学ぶ習慣を続けています。',
    });

    expect(card.id).toBeDefined();
    expect(card.memory_level).toBe(MemoryLevel.SOMEWHAT_FAMILIAR);

    const cards = await api.list_cards();
    expect(cards).toHaveLength(1);
  });

  it('records review updates and exposes analytics data', async () => {
    const api = get_renderer_api();
    const created = await api.ingest_card({
      word: '練習',
      reading: 'れんしゅう',
      context: '友達とスピーチの練習をする。',
      scene: '放課後の教室で練習している。',
      example: '本番の前に何度も練習した方がいい。',
    });

    await api.update_review({ card_id: created.id, memory_level: MemoryLevel.NEEDS_REINFORCEMENT });
    const snapshot = await api.fetch_analytics_snapshot();

    expect(snapshot.total_cards).toBe(1);
    expect(snapshot.total_reviews).toBe(1);
  });
});
