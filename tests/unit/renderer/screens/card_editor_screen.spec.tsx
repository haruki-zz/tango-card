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
      svg_source: '<svg />',
      created_at: '2024-01-01T00:00:00.000Z',
      tags: [],
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

    fireEvent.change(screen.getByLabelText('单词'), { target: { value: '勉強' } });
    fireEvent.change(screen.getByLabelText('平假名读音'), { target: { value: 'べんきょう' } });
    fireEvent.change(screen.getByLabelText('语境 / 情景'), { target: { value: '考试前的周末' } });
    fireEvent.change(screen.getByLabelText('例句'), { target: { value: '明日は一日中勉強します。' } });

    const memory_select = screen.getByRole('combobox', { name: /记忆等级/ }) as HTMLSelectElement;
    fireEvent.change(memory_select, { target: { value: MemoryLevel.NEEDS_REINFORCEMENT } });

    const save_button = screen.getByRole('button', { name: '保存卡片' });
    fireEvent.click(save_button);

    await waitFor(() => {
      expect(ingest_card).toHaveBeenCalledWith({
        card_id: undefined,
        svg_source: '<svg>template</svg>',
        tags: [],
        memory_level: MemoryLevel.NEEDS_REINFORCEMENT,
      });
    });

    expect(refresh_cards).toHaveBeenCalled();
    expect(screen.getByText('保存成功。')).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText('单词'), { target: { value: '勉強' } });
    fireEvent.change(screen.getByLabelText('平假名读音'), { target: { value: 'べんきょう' } });
    fireEvent.change(screen.getByLabelText('语境 / 情景'), { target: { value: '考试前的周末' } });
    fireEvent.change(screen.getByLabelText('例句'), { target: { value: '明日は一日中勉強します。' } });

    fireEvent.click(screen.getByRole('button', { name: '保存卡片' }));

    await waitFor(() => {
      expect(screen.getByText(/保存失败：network error/)).toBeInTheDocument();
    });
  });
});
