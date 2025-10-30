import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { AppRouter } from './routing/app_router';

export function AppShell() {
  return (
    <StrictMode>
      <AppRouter />
    </StrictMode>
  );
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing root container; cannot mount application.');
}

const root = createRoot(container);
root.render(<AppShell />);
