import { useMemo } from 'react';
import type { CardEntity } from '../../domain/card/card_entity';

interface HomeSearchBarProps {
  readonly cards: CardEntity[];
  readonly query: string;
  readonly on_query_change: (value: string) => void;
  readonly on_open_cards?: () => void;
  readonly on_create_card?: () => void;
}

const SUGGESTION_LIMIT = 5;

export function HomeSearchBar({
  cards,
  query,
  on_query_change,
  on_open_cards,
  on_create_card,
}: HomeSearchBarProps) {
  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return [];
    }
    return cards
      .filter((card) => card.word.toLowerCase().includes(normalized))
      .slice(0, SUGGESTION_LIMIT);
  }, [cards, query]);

  return (
    <section className="relative rounded-[36px] bg-white/[0.08] px-8 py-6 shadow-[0_25px_65px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/60">
          Quick search
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11 4a7 7 0 015.523 11.186l3.646 3.645a1 1 0 11-1.414 1.415l-3.645-3.646A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => on_query_change(event.target.value)}
            placeholder="Search saved words or readings"
            className="min-w-[180px] flex-1 bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && on_open_cards) {
                on_open_cards();
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={on_open_cards}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white"
            >
              Browse cards
            </button>
            <button
              type="button"
              onClick={on_create_card}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
            >
              Add new card
            </button>
          </div>
        </div>
      </div>
      {suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-[24px] border border-white/10 bg-slate-900/90 p-4 text-white shadow-[0_25px_50px_rgba(2,6,23,0.65)] backdrop-blur">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/50">
            Matches
          </p>
          <ul className="flex flex-col gap-2">
            {suggestions.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={on_open_cards}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <span className="font-medium">{card.word}</span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-white/60">
                    View all
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : query.trim().length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-[24px] border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white/80 shadow-[0_25px_50px_rgba(2,6,23,0.65)] backdrop-blur">
          No matching words found.
        </div>
      ) : null}
    </section>
  );
}
