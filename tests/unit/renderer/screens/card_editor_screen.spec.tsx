import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CardEditorScreen } from '../../../../src/renderer_process/screens/card_editor_screen';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';

jest.mock('../../../../src/renderer_process/utils/renderer_api', () => ({
  __esModule: true,
  get_renderer_api: jest.fn(),
}));

jest.mock('../../../../src/renderer_process/hooks/use_card_store', () => ({
  __esModule: true,
  use_card_store: jest.fn(),
}));

jest.mock('../../../../src/shared/templates/card_svg_template', () => ({
  __esModule: true,
  render_card_svg: jest.fn().mockReturnValue('<svg>template</svg>'),
}));

const mocked_get_renderer_api = jest.requireMock(
  '../../../../src/renderer_process/utils/renderer_api',
).get_renderer_api as jest.Mock;

const mocked_use_card_store = jest.requireMock(
  '../../../../src/renderer_process/hooks/use_card_store',
).use_card_store as jest.Mock;

describe('CardEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows selecting memory level and saving manually', async () => {
    const ingest_card = jest.fn().mockResolvedValue({
      id: 'card-1',
      word: '勉強',
      reading: 'べんきょう',
      context: '考试前的周末',
      scene: '安排好了学习计划',
      example: '明日は一日中勉強します。',
      created_at: '2024-01-01T00:00:00.000Z',
      memory_level: MemoryLevel.WELL_KNOWN,
      review_count: 0,
      last_reviewed_at: undefined,
    });
    const refresh_cards = jest.fn().mockResolvedValue(undefined);

    mocked_get_renderer_api.mockReturnValue({
      ingest_card,
    });
    mocked_use_card_store.mockReturnValue({
      refresh_cards,
    });

    render(<CardEditorScreen />);

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: '勉強' } });
    fireEvent.change(screen.getByLabelText('Hiragana Reading'), { target: { value: 'べんきょう' } });
    fireEvent.change(screen.getByLabelText('Context'), { target: { value: '考试前的周末' } });
    fireEvent.change(screen.getByLabelText('Scene'), { target: { value: '安排好了学习计划' } });
    fireEvent.change(screen.getByLabelText('Example Sentence'), { target: { value: '明日は一日中勉強します。' } });

    const memory_select = screen.getByRole('combobox', { name: /Memory Level/ }) as HTMLSelectElement;
    fireEvent.change(memory_select, { target: { value: MemoryLevel.NEEDS_REINFORCEMENT } });

    const save_button = screen.getByRole('button', { name: 'Save Card' });
    fireEvent.click(save_button);

    await waitFor(() => {
      expect(ingest_card).toHaveBeenCalledWith({
        card_id: undefined,
        word: '勉強',
        reading: 'べんきょう',
        context: '考试前的周末',
        scene: '安排好了学习计划',
        example: '明日は一日中勉強します。',
        memory_level: MemoryLevel.NEEDS_REINFORCEMENT,
      });
    });

    expect(refresh_cards).toHaveBeenCalled();
    expect(screen.getByText('Saved successfully.')).toBeInTheDocument();
  });

  it('shows error when save fails', async () => {
    const ingest_card = jest.fn().mockRejectedValue(new Error('network error'));
    const refresh_cards = jest.fn().mockResolvedValue(undefined);

    mocked_get_renderer_api.mockReturnValue({
      ingest_card,
    });
    mocked_use_card_store.mockReturnValue({
      refresh_cards,
    });

    render(<CardEditorScreen />);

    fireEvent.change(screen.getByLabelText('Word'), { target: { value: '勉強' } });
    fireEvent.change(screen.getByLabelText('Hiragana Reading'), { target: { value: 'べんきょう' } });
    fireEvent.change(screen.getByLabelText('Context'), { target: { value: '考试前的周末' } });
    fireEvent.change(screen.getByLabelText('Scene'), { target: { value: '安排好了学习计划' } });
    fireEvent.change(screen.getByLabelText('Example Sentence'), { target: { value: '明日は一日中勉強します。' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Card' }));

    await waitFor(() => {
      expect(screen.getByText(/Save failed: network error/)).toBeInTheDocument();
    });
  });
});
