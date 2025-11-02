interface WordsCardSummaryProps {
  readonly is_loading: boolean;
  readonly total_cards: number;
  readonly total_reviews: number;
  readonly recent_word?: string;
  readonly on_click?: () => void;
}

function format_total(value: number): string {
  return value.toLocaleString();
}

export function WordsCardSummary({
  is_loading,
  total_cards,
  total_reviews,
  recent_word,
  on_click,
}: WordsCardSummaryProps) {
  const has_cards = total_cards > 0;

  return (
    <button
      type="button"
      onClick={on_click}
      className="group w-full rounded-[36px] border-2 border-emerald-400 bg-white/95 px-6 py-10 text-left shadow-[0px_22px_50px_rgba(26,36,58,0.12)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0px_28px_60px_rgba(26,36,58,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:translate-y-0"
    >
      <div className="flex flex-col items-center gap-3 text-center text-slate-900">
        <span className="text-lg font-semibold tracking-wide">Words Card</span>
        {is_loading ? (
          <span className="text-sm text-slate-500">Loading cards...</span>
        ) : (
          <div className="flex flex-col items-center gap-3 text-sm text-slate-600">
            <span className="text-4xl font-semibold text-slate-900">
              {format_total(total_cards)}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Total Cards
            </span>
            <div className="flex items-center gap-4 text-xs uppercase tracking-wide text-slate-500">
              <span>
                Reviews
                <span className="ml-1 font-semibold text-slate-900">
                  {format_total(total_reviews)}
                </span>
              </span>
              <span>
                Latest
                <span className="ml-1 font-semibold text-slate-900">
                  {has_cards && recent_word ? recent_word : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
