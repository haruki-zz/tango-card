import type { CardEntity } from '../../domain/card/card_entity';

interface HomeFeaturedCardProps {
  readonly is_loading: boolean;
  readonly card: CardEntity | null;
  readonly on_open_cards?: () => void;
  readonly className?: string;
}

export function HomeFeaturedCard({
  is_loading,
  card,
  on_open_cards,
  className,
}: HomeFeaturedCardProps) {
  const root_class = [
    'flex flex-col rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/85 to-indigo-900/40 px-6 py-6 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.6)] backdrop-blur',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <section className={root_class}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Featured Word
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Revisit a word from your collection
          </h2>
        </div>
        {on_open_cards ? (
          <button
            type="button"
            onClick={on_open_cards}
            className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            View collection
          </button>
        ) : null}
      </header>

      {is_loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-6 w-1/2 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-white/10" />
          <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
        </div>
      ) : card ? (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Vocabulary</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{card.word}</h3>
            <p className="mt-1 text-lg text-white/70">{card.reading}</p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-white/90">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Context</p>
              <p className="mt-1 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white/90">
                {card.context}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Scene</p>
              <p className="mt-1 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white/90">
                {card.scene}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Example</p>
              <p className="mt-1 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white/90">
                {card.example}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-white/20 px-5 py-8 text-center text-white/75">
          <p className="text-base font-medium">Your collection is empty. Add your first word to see it here.</p>
        </div>
      )}
    </section>
  );
}
