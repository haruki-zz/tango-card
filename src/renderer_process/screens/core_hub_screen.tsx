interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8ecf5] px-6 py-12">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[40px] bg-gradient-to-br from-white via-[#f1f4fb] to-[#dfe8ff] px-8 py-10 shadow-[25px_25px_60px_#cfd6e6,-20px_-20px_55px_#ffffff]">
          <p className="text-xs uppercase tracking-[0.35em] text-[#94a3b8]">tango-card</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0f172a]">
            Desktop workspace for focused study
          </h1>
          <p className="mt-4 text-lg text-[#475569]">
            Wider canvas, persistent preview, and enough breathing room to build your vocabulary boards without feeling
            cramped.
          </p>
          <dl className="mt-8 grid gap-4 text-sm text-[#475569] sm:grid-cols-2">
            <div className="rounded-[28px] bg-white/80 p-4 shadow-[10px_10px_25px_rgba(15,23,42,0.08)]">
              <dt className="text-xs uppercase tracking-[0.3em] text-[#a1acc5]">Capture</dt>
              <dd className="mt-1 text-base text-[#0f172a]">Word · reading · scene in one flow</dd>
            </div>
            <div className="rounded-[28px] bg-white/80 p-4 shadow-[10px_10px_25px_rgba(15,23,42,0.08)]">
              <dt className="text-xs uppercase tracking-[0.3em] text-[#a1acc5]">Preview</dt>
              <dd className="mt-1 text-base text-[#0f172a]">Full-size SVG alongside the editor</dd>
            </div>
            <div className="rounded-[28px] bg-white/80 p-4 shadow-[10px_10px_25px_rgba(15,23,42,0.08)] sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.3em] text-[#a1acc5]">Review</dt>
              <dd className="mt-1 text-base text-[#0f172a]">Cycle through cards with desktop-friendly controls</dd>
            </div>
          </dl>
        </section>
        <section className="flex flex-col gap-5 rounded-[32px] bg-[#e8ecf5] p-6 shadow-[18px_18px_45px_#caced8,-12px_-12px_35px_#ffffff]">
          <div className="rounded-[28px] bg-white p-6 shadow-[inset_4px_4px_16px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-[#0f172a]">Quick actions</h2>
            <p className="mt-1 text-sm text-[#475569]">Choose the flow you want to run for your desktop session.</p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={on_create_card}
                className="w-full rounded-2xl border border-transparent bg-[#0f172a] px-6 py-3 text-base font-semibold text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5"
              >
                Create a card
              </button>
              <button
                type="button"
                onClick={on_start_review}
                className="w-full rounded-2xl border border-transparent bg-[#fcd34d] px-6 py-3 text-base font-semibold text-[#78350f] shadow-[inset_2px_2px_6px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5"
              >
                Start a review
              </button>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#0f172a] p-6 text-white shadow-[inset_6px_6px_18px_rgba(0,0,0,0.35)]">
            <h3 className="text-base font-semibold">Desktop tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>Use the extra width to keep preview and fields in view simultaneously.</li>
              <li>Start a review in one window while referencing notes in another.</li>
              <li>Create cards in batches—saving refreshes the shared store immediately.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
