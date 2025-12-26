const App = () => {
  const { platform, node, chrome, electron } = window.platformInfo;

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Tango Card</p>
        <h1>Desktop shell ready</h1>
        <p className="subtitle">
          Electron + React + Vite scaffold is running. Start wiring data flows and UI features
          next.
        </p>
      </header>

      <section className="card">
        <div className="card-row">
          <span className="label">Platform</span>
          <span className="value">{platform}</span>
        </div>
        <div className="card-row">
          <span className="label">Electron</span>
          <span className="value">{electron}</span>
        </div>
        <div className="card-row">
          <span className="label">Chrome</span>
          <span className="value">{chrome}</span>
        </div>
        <div className="card-row">
          <span className="label">Node</span>
          <span className="value">{node}</span>
        </div>
      </section>

      <p className="hint">Edit src/renderer/src/App.tsx to start building the vocabulary screens.</p>
    </div>
  );
};

export default App;
