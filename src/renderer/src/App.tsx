const App = () => {
  const { platform, node, chrome, electron } = window.platformInfo;
  const stats = [
    { label: '平台', value: platform },
    { label: 'Electron', value: electron },
    { label: 'Chrome', value: chrome },
    { label: 'Node', value: node },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <header className="flex w-full max-w-3xl flex-col gap-3 text-left sm:text-center">
        <span className="pill self-start sm:self-center">Tango Card</span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          桌面壳已就绪
        </h1>
        <p className="text-base text-muted sm:text-lg">
          Electron + React + Vite
          热启动完成，接下来接入词库、复习队列与活跃度视图。
        </p>
      </header>

      <section className="surface-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-500 shadow-[0_0_0_6px_rgba(34,197,94,0.12)]" />
            <p className="text-sm font-semibold text-ink">运行环境</p>
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            electron + react + vite
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {stats.map(({ label, value }) => (
            <div className="stat-row" key={label}>
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted">
        编辑 src/renderer/src/App.tsx 继续构建新增、复习与活跃度界面。
      </p>
    </div>
  );
};

export default App;
