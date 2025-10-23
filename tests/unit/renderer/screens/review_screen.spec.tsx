import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    tags: [],
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
    mocked_use_review_cycle.mockReturnValue({
      queue: [],
      active_card: undefined,
      active_index: 0,
      load_queue,
      submit_review: jest.fn(),
      reset_queue: jest.fn(),
    });

    render(<ReviewScreen />);

    expect(screen.getByText('准备复习')).toBeInTheDocument();
    await waitFor(() => {
      expect(load_queue).toHaveBeenCalled();
    });
  });

  it('allows selecting a memory level and submits the review', async () => {
    const load_queue = jest.fn().mockResolvedValue(undefined);
    const submit_review = jest.fn().mockResolvedValue(undefined);
    const candidate = create_candidate();

    mocked_use_review_cycle.mockReturnValue({
      queue: [candidate],
      active_card: candidate,
      active_index: 0,
      load_queue,
      submit_review,
      reset_queue: jest.fn(),
    });

    render(<ReviewScreen />);

    const current_label = MEMORY_LEVEL_OPTIONS.find(
      (option) => option.level === candidate.memory_level,
    )?.label;

    if (current_label) {
      expect(screen.getByText(current_label)).toBeInTheDocument();
    }

    const target_option = MEMORY_LEVEL_OPTIONS[0];
    const button = screen.getByRole('button', {
      name: new RegExp(`标记为「${target_option.label}」`),
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(submit_review).toHaveBeenCalledWith(candidate.id, target_option.level);
    });
  });
});
