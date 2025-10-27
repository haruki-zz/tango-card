import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AnalyticsScreen } from '../../../../src/renderer_process/screens/analytics_screen';
import type { ActivitySnapshot } from '../../../../src/domain/analytics/activity_snapshot';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';

jest.mock('../../../../src/renderer_process/utils/renderer_api', () => ({
  __esModule: true,
  get_renderer_api: jest.fn(),
}));

const mocked_get_renderer_api = jest.requireMock(
  '../../../../src/renderer_process/utils/renderer_api',
).get_renderer_api as jest.Mock;

describe('AnalyticsScreen', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-10T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders analytics metrics, heatmap controls, and memory distribution', async () => {
    const snapshot: ActivitySnapshot = {
      streak_days: 3,
      total_cards: 4,
      total_reviews: 7,
      points: [
        { date: '2024-03-04T00:00:00.000Z', created_cards: 1, reviewed_cards: 0 },
        { date: '2024-03-08T00:00:00.000Z', created_cards: 2, reviewed_cards: 3 },
      ],
    };
    const cards = [
      { id: 'a', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.WELL_KNOWN, review_count: 0, last_reviewed_at: undefined },
      { id: 'b', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.SOMEWHAT_FAMILIAR, review_count: 0, last_reviewed_at: undefined },
      { id: 'c', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.NEEDS_REINFORCEMENT, review_count: 0, last_reviewed_at: undefined },
      { id: 'd', svg_source: '', created_at: '', tags: [], memory_level: MemoryLevel.NEEDS_REINFORCEMENT, review_count: 0, last_reviewed_at: undefined },
    ];

    const fetch_snapshot = jest.fn().mockResolvedValue(snapshot);
    const list_cards = jest.fn().mockResolvedValue(cards);

    mocked_get_renderer_api.mockImplementation(() => ({
      fetch_analytics_snapshot: fetch_snapshot,
      list_cards,
    }));

    render(<AnalyticsScreen />);

    await waitFor(() => {
      expect(screen.getByText('连续学习天数')).toBeInTheDocument();
    });

    expect(fetch_snapshot).toHaveBeenCalled();
    expect(list_cards).toHaveBeenCalled();

    expect(screen.getByText('3 天')).toBeInTheDocument();
    expect(screen.getByText('近 7 天新增')).toBeInTheDocument();
    expect(screen.getByText('4 张卡片')).toBeInTheDocument();

    const heatmapCells = await screen.findAllByRole('gridcell');
    expect(heatmapCells.length).toBeGreaterThan(0);
    expect(screen.getByLabelText('2024-03-08：5 次学习活动')).toBeInTheDocument();

    const createdButton = screen.getByRole('button', { name: /每日新增/ });
    fireEvent.click(createdButton);
    expect(createdButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('2024-03-08：2 次新增卡片')).toBeInTheDocument();

    expect(screen.getByText('熟知')).toBeInTheDocument();
    expect(screen.getByText('需要强化')).toBeInTheDocument();
    expect(screen.getAllByText(/张$/).length).toBeGreaterThan(0);
  });
});
