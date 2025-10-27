import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingsScreen } from '../../../../src/renderer_process/screens/settings_screen';

jest.mock('../../../../src/renderer_process/utils/renderer_api', () => ({
  __esModule: true,
  get_renderer_api: jest.fn(),
}));

const mocked_get_renderer_api = jest.requireMock(
  '../../../../src/renderer_process/utils/renderer_api',
).get_renderer_api as jest.Mock;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers export and import actions with feedback messaging', async () => {
    const export_cards = jest
      .fn()
      .mockResolvedValue({ status: 'success', exported_cards: 2, exported_sessions: 1, file_path: '/tmp/cards.json' });
    const import_cards = jest
      .fn()
      .mockResolvedValue({ status: 'success', imported_cards: 2, imported_sessions: 1, file_path: '/tmp/cards.json' });

    mocked_get_renderer_api.mockReturnValue({
      export_cards,
      import_cards,
    });

    render(<SettingsScreen />);

    const export_json_button = screen.getByRole('button', { name: '导出 JSON' });
    fireEvent.click(export_json_button);

    await waitFor(() => {
      expect(export_cards).toHaveBeenCalledWith({ format: 'json' });
      expect(screen.getByText(/成功导出 2 张卡片/)).toBeInTheDocument();
    });

    const import_button = screen.getByRole('button', { name: '导入备份' });
    fireEvent.click(import_button);

    await waitFor(() => {
      expect(import_cards).toHaveBeenCalled();
      expect(screen.getByText(/成功导入 2 张卡片/)).toBeInTheDocument();
    });
  });
});
