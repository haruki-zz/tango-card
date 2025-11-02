import { useEffect, useMemo, useState } from 'react';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { CardEntity } from '../../domain/card/card_entity';
import { build_heatmap_cells } from '../services/analytics_builder';
import { get_renderer_api } from '../utils/renderer_api';
import { use_card_store } from '../hooks/use_card_store';
import { HomeHeatmapCard } from '../components/home_heatmap_card';
import { HomeFeaturedCard } from '../components/home_featured_card';
import { HomeSearchBar } from '../components/home_search_bar';

interface HomeScreenProps {
  on_open_analytics(): void;
  on_open_cards(): void;
  on_start_review(): void;
  on_create_card(): void;
}

export function HomeScreen({
  on_open_analytics,
  on_open_cards,
  on_start_review,
  on_create_card,
}: HomeScreenProps) {
  const { cards, is_loading: is_cards_loading, error_message } = use_card_store();
  const [snapshot, set_snapshot] = useState<ActivitySnapshot | null>(null);
  const [snapshot_error, set_snapshot_error] = useState<string | null>(null);
  const [is_loading_snapshot, set_is_loading_snapshot] = useState(true);
  const [featured_card, set_featured_card] = useState<CardEntity | null>(null);
  const [search_query, set_search_query] = useState('');

  useEffect(() => {
    let canceled = false;
    get_renderer_api()
      .fetch_analytics_snapshot()
      .then((data) => {
        if (canceled) {
          return;
        }
        set_snapshot(data);
        set_snapshot_error(null);
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        set_snapshot(null);
        set_snapshot_error((error as Error).message);
      })
      .finally(() => {
        if (canceled) {
          return;
        }
        set_is_loading_snapshot(false);
      });
    return () => {
      canceled = true;
    };
  }, []);

  const heatmap_cells = useMemo(() => (snapshot ? build_heatmap_cells(snapshot) : []), [snapshot]);
  useEffect(() => {
    let canceled = false;
    const timer = setTimeout(() => {
      if (canceled) {
        return;
      }
      if (cards.length === 0) {
        set_featured_card(null);
        return;
      }
      const random_index = Math.floor(Math.random() * cards.length);
      set_featured_card(cards[random_index]);
    }, 0);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [cards]);
  const total_cards = cards.length;
  const can_start_review = total_cards > 0 && !is_cards_loading;
  const show_error = error_message ?? snapshot_error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col gap-6">
          <HomeSearchBar
            cards={cards}
            query={search_query}
            on_query_change={set_search_query}
            on_open_cards={on_open_cards}
            on_create_card={on_create_card}
          />

          <HomeHeatmapCard
            cells={heatmap_cells}
            is_loading={is_loading_snapshot}
            on_open_analytics={on_open_analytics}
          />

          <HomeFeaturedCard
            is_loading={is_cards_loading}
            card={featured_card}
            on_open_cards={on_open_cards}
          />
          {show_error ? (
            <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
              {show_error}
            </p>
          ) : null}
        </div>

        <footer className="mt-12 flex items-end justify-between gap-5">
          <button
            type="button"
            onClick={on_start_review}
            disabled={!can_start_review}
            className="flex-1 rounded-full bg-white px-6 py-4 text-lg font-semibold text-slate-900 shadow-[0px_20px_45px_rgba(26,36,58,0.18)] transition-[transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none hover:-translate-y-[1px] hover:shadow-[0px_26px_55px_rgba(26,36,58,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Start Review
          </button>
          <button
            type="button"
            onClick={on_create_card}
            aria-label="Create new card"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl font-semibold text-slate-900 shadow-[0px_16px_40px_rgba(26,36,58,0.18)] transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] hover:shadow-[0px_22px_52px_rgba(26,36,58,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            +
          </button>
        </footer>
      </main>
    </div>
  );
}
