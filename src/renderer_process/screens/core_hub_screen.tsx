interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  return (
    <div className="min-h-screen w-full bg-[#05060b] px-4 py-10 text-[#e2e8f0]">
      <div className="mx-auto w-full max-w-6xl border border-[#1f2433] bg-[#090c14] p-4 text-xs uppercase tracking-[0.3em] text-[#94a3b8]">
        tango-card // desktop terminal ui
      </div>
      <div className="mx-auto mt-4 grid w-full max-w-6xl gap-6 border border-[#1f2433] bg-[#05060b] p-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-[#1f2433] bg-[#090c14] p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <header className="border-b border-[#1f2433] pb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22d3ee]">tango-card // hub</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#f8fafc]">terminal workspace</h1>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Capture vocabulary, render cards, and run recall loops without leaving your keyboard.
            </p>
          </header>
          <div className="mt-5 space-y-3 text-sm text-[#9ca3af]">
            <p>
              [01] <span className="text-[#e2e8f0]">capture</span> · single-flow word entry w/ scene + reading slots
            </p>
            <p>
              [02] <span className="text-[#e2e8f0]">render</span> · SVG preview mirrors export resolution in realtime
            </p>
            <p>
              [03] <span className="text-[#e2e8f0]">review</span> · FIFO queue with keyboard arrows + swipe gestures
            </p>
          </div>
          <div className="mt-6 border border-dashed border-[#303849] p-4 text-xs text-[#94a3b8]">
            Tip: run both flows side-by-side by spawning another window (<span className="text-[#22d3ee]">⌘+N</span>).
          </div>
        </section>
        <section className="flex flex-col gap-6 border border-[#1f2433] bg-[#0b0f19] p-6 text-sm text-[#cbd5f5]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#94a3b8]">commands</p>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={on_create_card}
                className="flex w-full items-center justify-between border border-[#394155] bg-[#0f131f] px-4 py-3 text-left text-base tracking-wide text-[#22d3ee] transition hover:bg-[#151b2c]"
              >
                <span>&gt; create_card --new</span>
                <span className="text-xs text-[#94a3b8]">ENTER</span>
              </button>
              <button
                type="button"
                onClick={on_start_review}
                className="flex w-full items-center justify-between border border-[#394155] bg-[#0f131f] px-4 py-3 text-left text-base tracking-wide text-[#fcd34d] transition hover:bg-[#151b2c]"
              >
                <span>&gt; review_session --start</span>
                <span className="text-xs text-[#94a3b8]">SHIFT+ENTER</span>
              </button>
            </div>
          </div>
          <div className="border border-[#303849] bg-[#080c15] p-4">
            <h3 className="text-xs uppercase tracking-[0.35em] text-[#94a3b8]">status</h3>
            <ul className="mt-3 space-y-2 font-mono text-xs text-[#cbd5f5]">
              <li>• cards synced: {`{`}local{`}`}</li>
              <li>• next review batch: balanced schedule</li>
              <li>• svg renderer: ready</li>
            </ul>
          </div>
          <div className="border border-[#303849] bg-[#05070d] p-4 text-xs text-[#94a3b8]">
            Need help? Run <span className="text-[#22d3ee]">docs --open &quot;review_flow&quot;</span> from the command palette.
          </div>
        </section>
      </div>
    </div>
  );
}
