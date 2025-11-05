import type { CardEntity } from '../../domain/card/card_entity';

interface HomeFeaturedCardProps {
  readonly is_loading: boolean;
  readonly card: CardEntity | null;
  readonly on_open_cards?: () => void;
}

export function HomeFeaturedCard({ is_loading, card, on_open_cards }: HomeFeaturedCardProps) {
  return (
    <section className="rounded-[32px] border border-black bg-white px-6 py-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/70">
            Featured Word
          </p>
          <h2 className="mt-2 text-xl font-semibold text-black">
            Revisit a card from your collection
          </h2>
        </div>
        {on_open_cards ? (
          <button
            type="button"
            onClick={on_open_cards}
            className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60"
          >
            View Cards
          </button>
        ) : null}
      </header>

      {is_loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-7 w-2/3 animate-pulse rounded-full bg-black/15" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-black/15" />
          <div className="h-20 animate-pulse rounded-3xl bg-black/15" />
        </div>
      ) : card ? (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-black/70">Vocabulary</p>
            <h3 className="mt-2 text-3xl font-semibold text-black">{card.word}</h3>
            <p className="mt-1 text-lg text-black/70">{card.reading}</p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-black">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-black/70">Context</p>
              <p className="mt-1 rounded-[18px] bg-black/5 px-4 py-3 text-black">
                {card.context}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-black/70">Scene</p>
              <p className="mt-1 rounded-[18px] bg-black/5 px-4 py-3 text-black">{card.scene}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-black/70">Example</p>
              <p className="mt-1 rounded-[18px] bg-black/5 px-4 py-3 text-black">
                {card.example}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-black px-5 py-8 text-center">
          <p className="text-base font-medium text-black">
            Your collection is empty. Add your first word to generate a card preview here.
          </p>
        </div>
      )}
    </section>
  );
}
