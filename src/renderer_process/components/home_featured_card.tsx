import type { CardEntity } from '../../domain/card/card_entity';

interface HomeFeaturedCardProps {
  readonly is_loading: boolean;
  readonly card: CardEntity | null;
  readonly on_open_cards?: () => void;
}

export function HomeFeaturedCard({ is_loading, card, on_open_cards }: HomeFeaturedCardProps) {
  return (
    <section className="rounded-[40px] border border-slate-200/60 bg-white/90 p-8 shadow-[0px_26px_60px_rgba(26,36,58,0.12)] backdrop-blur">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Featured Word
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Revisit a card from your collection
          </h2>
        </div>
        {on_open_cards ? (
          <button
            type="button"
            onClick={on_open_cards}
            className="rounded-full border border-slate-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/80"
          >
            View Cards
          </button>
        ) : null}
      </header>

      {is_loading ? (
        <div className="mt-8 space-y-5">
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      ) : card ? (
        <div className="mt-8 flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Vocabulary</p>
            <h3 className="mt-2 text-4xl font-semibold text-slate-900">{card.word}</h3>
            <p className="mt-1 text-xl text-slate-500">{card.reading}</p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Context</p>
              <p className="mt-1 rounded-3xl bg-slate-100 px-4 py-3 text-slate-700">{card.context}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Scene</p>
              <p className="mt-1 rounded-3xl bg-slate-100 px-4 py-3 text-slate-700">{card.scene}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Example</p>
              <p className="mt-1 rounded-3xl bg-emerald-50 px-4 py-3 text-slate-700">
                {card.example}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-emerald-200 px-5 py-8 text-center">
          <p className="text-base font-medium text-slate-600">
            Your collection is empty. Add your first word to generate a card preview here.
          </p>
        </div>
      )}
    </section>
  );
}

