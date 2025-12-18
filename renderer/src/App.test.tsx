import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders placeholder content', () => {
    render(<App />);
    expect(screen.getByText('Tango Card')).toBeInTheDocument();
    expect(
      screen.getByText('项目骨架已就绪，后续将补充 Electron、数据库与 AI 逻辑。')
    ).toBeInTheDocument();
  });
});
