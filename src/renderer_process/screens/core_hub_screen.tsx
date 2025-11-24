import { use_card_store } from '../hooks/use_card_store';
import { HeatMap } from '../components/heat_map';

interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  const { cards, is_loading, daily_activity, activity_window_days, set_activity_window } = use_card_store();
  const total_cards = cards.length;
  const pending_reviews = cards.filter((card) => card.review_count === 0).length;

  return (
    <div className="min-h-screen w-full bg-[#05060b] px-4 py-10 text-[#e2e8f0]">
      <div className="mx-auto w-full max-w-5xl border border-[#1f2433] bg-[#05070d]">
        <header className="border-b border-[#1f2433] px-4 py-3 text-xs uppercase tracking-[0.3em] text-[#94a3b8]">
          tango-card // two commands
        </header>
        <div className="grid gap-4 px-4 py-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-[#1f2433] bg-[#090c14] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22d3ee]">status</p>
            <div className="mt-3 font-mono text-sm text-[#cbd5f5]">
              <p>{`cards_saved  : ${is_loading ? '···' : total_cards.toString().padStart(3, '0')}`}</p>
              <p>{`pending_revs : ${is_loading ? '···' : pending_reviews.toString().padStart(3, '0')}`}</p>
              <p>{`last_action  : ${total_cards === 0 ? 'none' : 'ready'}`}</p>
            </div>
            <div className="mt-4 font-mono text-xs text-[#4c5369]">───────────────────────────────</div>
          </section>
          <section className="flex flex-col gap-4 border border-[#1f2433] bg-[#0b0f19] p-4 text-sm text-[#cbd5f5]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#94a3b8]">commands</p>
            <button
              type="button"
              onClick={on_create_card}
              className="flex w-full items-center justify-between border border-[#394155] bg-[#0f131f] px-4 py-3 text-left font-mono tracking-wide text-[#22d3ee] transition hover:bg-[#151b2c]"
            >
              <span>&gt; create_card --new</span>
              <span className="text-xs text-[#94a3b8]">ENTER</span>
            </button>
            <button
              type="button"
              onClick={on_start_review}
              className="flex w-full items-center justify-between border border-[#394155] bg-[#0f131f] px-4 py-3 text-left font-mono tracking-wide text-[#fcd34d] transition hover:bg-[#151b2c]"
            >
              <span>&gt; review_session --start</span>
              <span className="text-xs text-[#94a3b8]">SHIFT+ENTER</span>
            </button>
          </section>
          <section className="lg:col-span-2 border border-[#1f2433] bg-[#090c14] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#94a3b8]">activity heat map</p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#94a3b8]">
                <button
                  type="button"
                  onClick={() => set_activity_window(30)}
                  className={`border px-2 py-0.5 ${
                    activity_window_days === 30 ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-[#394155]'
                  }`}
                >
                  30d
                </button>
                <button
                  type="button"
                  onClick={() => set_activity_window(60)}
                  className={`border px-2 py-0.5 ${
                    activity_window_days === 60 ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-[#394155]'
                  }`}
                >
                  60d
                </button>
                <button
                  type="button"
                  onClick={() => set_activity_window(84)}
                  className={`border px-2 py-0.5 ${
                    activity_window_days === 84 ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-[#394155]'
                  }`}
                >
                  12w
                </button>
              </div>
            </div>
            <div className="mt-3">
              <HeatMap data={daily_activity} columns={21} rows={7} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
