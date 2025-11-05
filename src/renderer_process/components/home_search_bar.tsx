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
    <section className="relative">
      <div className="flex items-center gap-3 rounded-[28px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(event) => on_query_change(event.target.value)}
          placeholder="Search existing words"
          className="w-full bg-transparent text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && on_open_cards) {
              on_open_cards();
            }
          }}
        />
        <button
          type="button"
          aria-label="Create new card"
          onClick={on_create_card}
          className="flex h-10 w-[52px] items-center justify-center rounded-[20px] bg-slate-900 text-2xl font-semibold text-white transition-transform hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
        >
          +
        </button>
      </div>
      {suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-[20px] border border-slate-200 bg-white p-3 shadow-lg">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Matches
          </p>
          <ul className="flex flex-col gap-2">
            {suggestions.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={on_open_cards}
                  className="flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/60"
                >
                  <span className="font-medium text-slate-900">{card.word}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    View all
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : query.trim().length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
          No matching words found.
        </div>
      ) : null}
    </section>
  );
}
