import { use_card_store } from '../hooks/use_card_store';

interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  const { cards, is_loading } = use_card_store();
  const total_cards = cards.length;
  const pending_reviews = cards.filter((card) => card.review_count === 0).length;

  return (
    <div className="min-h-screen w-full bg-[#05060b] px-4 py-10 text-[#e2e8f0]">
      <div className="mx-auto w-full max-w-5xl rounded-sm border border-[#1f2433] bg-gradient-to-b from-[#06080f] to-[#090c14] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <header className="border-b border-[#1f2433] px-4 py-3 text-xs uppercase tracking-[0.3em] text-[#94a3b8]">
          tango-card // two commands
        </header>
        <div className="grid gap-5 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-sm border border-[#1f2433] bg-[#0a0d17] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22d3ee]">status</p>
            <div className="mt-4 grid gap-2 font-mono text-sm text-[#cbd5f5]">
              <div className="flex items-center justify-between rounded-sm bg-[#0f1220] px-3 py-2">
                <span className="text-[#6b7280]">cards_saved</span>
                <span className="text-[#f8fafc]">
                  {is_loading ? '···' : total_cards.toString().padStart(3, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-sm bg-[#0f1220] px-3 py-2">
                <span className="text-[#6b7280]">pending_revs</span>
                <span className="text-[#f8fafc]">
                  {is_loading ? '···' : pending_reviews.toString().padStart(3, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-sm bg-[#0f1220] px-3 py-2">
                <span className="text-[#6b7280]">state</span>
                <span className="text-[#38bdf8]">{total_cards === 0 ? 'idle' : 'ready'}</span>
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-3 rounded-sm border border-[#1f2433] bg-[#0b0f19] p-4 text-sm text-[#cbd5f5]">
            <p className="text-xs uppercase tracking-[0.35em] text-[#94a3b8]">commands</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={on_create_card}
                className="flex w-full items-center justify-between rounded-[3px] border border-[#2f3647] bg-[#0f131f] px-4 py-3 text-left font-mono tracking-wide text-[#22d3ee] transition hover:border-[#38bdf8] hover:text-[#38bdf8]"
              >
                <span>&gt; create_card --new</span>
                <span className="text-[10px] text-[#6b7280]">ENTER</span>
              </button>
              <button
                type="button"
                onClick={on_start_review}
                className="flex w-full items-center justify-between rounded-[3px] border border-[#2f3647] bg-[#0f131f] px-4 py-3 text-left font-mono tracking-wide text-[#fcd34d] transition hover:border-[#f59e0b]"
              >
                <span>&gt; review_session --start</span>
                <span className="text-[10px] text-[#6b7280]">SHIFT + ENTER</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6b7280]">
              stay minimal: focus on add / review and keep streak in motion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
