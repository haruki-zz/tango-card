import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { ReviewCandidate } from '../../../../src/domain/review/review_policy';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import { MEMORY_LEVEL_OPTIONS } from '../../../../src/shared/constants/memory_levels';
import { ReviewScreen } from '../../../../src/renderer_process/screens/review_screen';
import { use_review_cycle } from '../../../../src/renderer_process/hooks/use_review_cycle';

jest.mock('../../../../src/renderer_process/hooks/use_review_cycle');

const mocked_use_review_cycle = use_review_cycle as unknown as jest.MockedFunction<
  typeof use_review_cycle
>;

function create_candidate(overrides: Partial<ReviewCandidate> = {}): ReviewCandidate {
  return {
    id: 'card-id',
    svg_source: '<svg></svg>',
    created_at: '2023-01-01T00:00:00.000Z',
    memory_level: MemoryLevel.SOMEWHAT_FAMILIAR,
    review_count: 0,
    last_reviewed_at: undefined,
    weight: 1,
    ...overrides,
  };
}

describe('ReviewScreen', () => {
  beforeEach(() => {
    mocked_use_review_cycle.mockReset();
  });

  it('renders an empty state when no card is active', async () => {
    const load_queue = jest.fn().mockResolvedValue(undefined);
    mocked_use_review_cycle.mockImplementation(() => ({
      queue: [],
      active_card: undefined,
      active_index: 0,
      load_queue,
      submit_review: jest.fn(),
      reset_queue: jest.fn(),
    }));

    render(<ReviewScreen />);

    expect(screen.getByText('Ready to Review')).toBeInTheDocument();
    await waitFor(() => {
      expect(load_queue).toHaveBeenCalled();
    });
  });

  it('allows selecting a memory level and submits the review', async () => {
    const load_queue = jest.fn().mockResolvedValue(undefined);
    const submit_review = jest.fn().mockResolvedValue(undefined);
    const candidate = create_candidate();

    mocked_use_review_cycle.mockImplementation(() => ({
      queue: [candidate],
      active_card: candidate,
      active_index: 0,
      load_queue,
      submit_review,
      reset_queue: jest.fn(),
    }));

    render(<ReviewScreen />);

    expect(
      screen.getByText(/Choose a memory level and select “Log Memory Level.” Shortcuts 1\/2\/3, arrow keys, or swipe gestures submit instantly./),
    ).toBeInTheDocument();

    const target_option = MEMORY_LEVEL_OPTIONS[0];
    const selector = screen.getByRole('combobox', { name: /Memory Level/ }) as HTMLSelectElement;
    fireEvent.change(selector, { target: { value: target_option.level } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Log Memory Level' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Memory level recorded.')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: target_option.shortcut });

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Memory level recorded.')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Memory level recorded.')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Memory level recorded.')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Memory level recorded.')).toBeInTheDocument();
    });
  });
});
