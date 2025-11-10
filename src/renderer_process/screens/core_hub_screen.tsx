interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">tango-card</p>
        <h1 className="mt-3 text-3xl font-semibold">Build and review your vocabulary</h1>
        <p className="mt-2 text-sm text-white/70">
          Add new words, then run a quick review session whenever you are ready.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={on_create_card}
          className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white transition hover:border-white hover:text-white"
        >
          Create a card
        </button>
        <button
          type="button"
          onClick={on_start_review}
          className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90"
        >
          Start review
        </button>
      </div>
    </div>
  );
}
