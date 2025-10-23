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
      svg_source: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
      tags: ['mock'],
    });

    expect(card.id).toBeDefined();
    expect(card.memory_level).toBe(MemoryLevel.SOMEWHAT_FAMILIAR);

    const cards = await api.list_cards();
    expect(cards).toHaveLength(1);
  });

  it('records review updates and exposes analytics data', async () => {
    const api = get_renderer_api();
    const created = await api.ingest_card({
      svg_source: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>',
    });

    await api.update_review(created.id, MemoryLevel.NEEDS_REINFORCEMENT);
    const snapshot = await api.fetch_analytics_snapshot();

    expect(snapshot.total_cards).toBe(1);
    expect(snapshot.total_reviews).toBe(1);
  });
});
