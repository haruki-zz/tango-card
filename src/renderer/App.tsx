import { useState } from 'react';

function App() {
  const [message] = useState(() => (window.api?.ping ? window.api.ping() : ''));

  return (
    <div className="app-shell">
      <div className="card">
        <p className="eyebrow">Tango Card</p>
        <h1>项目骨架已就绪</h1>
        <p className="muted">Electron + Vite + React + TypeScript</p>
        <p className="pill">Preload ping: {message || '...'}</p>
      </div>
    </div>
  );
}

export default App;
