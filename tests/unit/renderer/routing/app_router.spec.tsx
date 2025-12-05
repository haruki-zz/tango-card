import { render, screen, fireEvent } from '@testing-library/react';
import { AppRouter } from '../../../../src/renderer_process/routing/app_router';

describe('AppRouter theme toggle', () => {
  it('toggles between dark and light labels without navigation', () => {
    render(<AppRouter />);
    const toggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggle).toHaveTextContent(/light mode/i);

    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent(/dark mode/i);

    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent(/light mode/i);
  });
});

