import { card_store } from '../../../../src/renderer_process/state/card_store';

describe('card_store', () => {
  beforeEach(() => {
    card_store.getState().reset();
  });

  it('toggles loading state and clears errors', () => {
    card_store.setState({ error_message: 'error', is_loading: false }, false);
    card_store.getState().set_loading(true);
    const state = card_store.getState();
    expect(state.is_loading).toBe(true);
    expect(state.error_message).toBeUndefined();
  });

  it('stores cards and resets loading/error flags', () => {
    card_store.setState({ is_loading: true, error_message: 'oops' }, false);
    card_store.getState().set_cards([]);
    const state = card_store.getState();
    expect(state.is_loading).toBe(false);
    expect(state.error_message).toBeUndefined();
  });
});
