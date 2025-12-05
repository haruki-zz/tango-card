import { fireEvent, render } from '@testing-library/react';
import { CoreHubScreen } from '../../../../src/renderer_process/screens/core_hub_screen';

const set_activity_window = jest.fn();

jest.mock('../../../../src/renderer_process/hooks/use_card_store', () => ({
  use_card_store: () => ({
    cards: [],
    is_loading: false,
    daily_activity: [],
    activity_window_days: 70,
    set_activity_window,
  }),
}));

jest.mock('../../../../src/renderer_process/hooks/use_element_size', () => ({
  use_element_size: () => ({ attach_ref: jest.fn(), size: { width: 0, height: 0 } }),
}));

describe('CoreHubScreen hotkeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers create card on Enter and review on Shift+Enter', () => {
    const on_create_card = jest.fn();
    const on_start_review = jest.fn();

    render(
      <CoreHubScreen
        theme="dark"
        on_toggle_theme={jest.fn()}
        on_create_card={on_create_card}
        on_start_review={on_start_review}
      />,
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(on_create_card).toHaveBeenCalledTimes(1);
    expect(on_start_review).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    expect(on_start_review).toHaveBeenCalledTimes(1);
  });
});

