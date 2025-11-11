interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review }: CoreHubScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white px-6 py-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6b7280]">tango-card</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111827]">Your two daily steps</h1>
        <p className="mt-1 text-sm text-[#4b5563]">Add a word when you learn it, review a few when you have time.</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={on_create_card}
            className="w-full rounded-full border border-[#111827] bg-white text-sm font-medium text-[#111827] transition hover:bg-[#111827] hover:text-white"
          >
            Create a card
          </button>
          <button
            type="button"
            onClick={on_start_review}
            className="w-full rounded-full bg-[#111827] text-sm font-medium text-white transition hover:opacity-85"
          >
            Start a review
          </button>
        </div>
      </div>
    </div>
  );
}
