interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8ecf5] px-4">
      <div className="w-full max-w-md rounded-[32px] bg-[#e8ecf5] px-8 py-10 shadow-[15px_15px_35px_#d0d4de,-15px_-15px_35px_#ffffff]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#94a3b8]">tango-card</p>
        <h1 className="mt-2 text-3xl font-semibold">Two simple actions</h1>
        <p className="mt-1 text-sm text-[#475569]">Add a word when you meet it. Review a few when you have a minute.</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={on_create_card}
            className="w-full rounded-full border border-transparent bg-white text-sm font-medium text-[#0f172a] shadow-[inset_2px_2px_6px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            Create a card
          </button>
          <button
            type="button"
            onClick={on_start_review}
            className="w-full rounded-full border border-transparent bg-[#0f172a] text-sm font-medium text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
          >
            Start a review
          </button>
        </div>
      </div>
    </div>
  );
}
