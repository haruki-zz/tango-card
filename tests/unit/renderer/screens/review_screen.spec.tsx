import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReviewCandidate } from '../../../../src/domain/review/review_policy';
import { ReviewScreen } from '../../../../src/renderer_process/screens/review_screen';
import { use_review_cycle } from '../../../../src/renderer_process/hooks/use_review_cycle';

jest.mock('../../../../src/renderer_process/hooks/use_review_cycle');
jest.mock('../../../../src/renderer_process/components/svg_canvas', () => ({
  __esModule: true,
  SvgCanvas: ({ svg_source }: { svg_source: string }) => (
    <div data-testid="svg-canvas">{svg_source}</div>
  ),
}));

const mock_use_review_cycle = use_review_cycle as jest.MockedFunction<typeof use_review_cycle>;

describe('ReviewScreen', () => {
  const submit_review = jest.fn();
  const reset_queue = jest.fn();
  const move_previous = jest.fn();
  const move_next = jest.fn();
  const update_familiarity = jest.fn();
  const start_round = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    submit_review.mockResolvedValue(undefined);
    const card: ReviewCandidate = {
      id: 'card-1',
      word: '語彙',
      reading: 'ごい',
      context: 'context',
      scene: 'scene',
      example: 'example',
      created_at: '2023-01-01T00:00:00.000Z',
      review_count: 0,
      familiarity: 'normal',
      front_svg_source: '<svg>front</svg>',
      back_svg_source: '<svg>back</svg>',
    };
    mock_use_review_cycle.mockReturnValue({
      queue: [card],
      active_card: card,
      active_index: 0,
      reviewed_ids: [],
      start_round,
      submit_review,
      reset_queue,
      move_previous,
      move_next,
      update_familiarity,
    });
  });

  it('shows the front first and flips before submitting', async () => {
    const on_exit = jest.fn();
    render(<ReviewScreen on_exit={on_exit} />);

    expect(screen.getByTestId('svg-canvas')).toHaveTextContent('front');

    fireEvent.click(screen.getByText('[→] done'));

    expect(submit_review).not.toHaveBeenCalled();
    expect(screen.getByTestId('svg-canvas')).toHaveTextContent('back');

    fireEvent.click(screen.getByText('[→] done'));

    await waitFor(() => expect(submit_review).toHaveBeenCalledWith('card-1'));
    expect(on_exit).toHaveBeenCalledTimes(1);
  });
});
