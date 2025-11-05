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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-[478px] flex-col px-[32px] pb-[78px] pt-[78px]">
        <div className="flex flex-1 flex-col gap-[36px]">
          <div className="flex flex-col gap-[24px]">
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
          </div>

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

        <footer className="mt-[48px] flex justify-center">
          <button
            type="button"
            onClick={on_start_review}
            disabled={!can_start_review}
            className="w-[258px] rounded-[30px] bg-[#111827] py-4 text-lg font-semibold text-white shadow-[0px_20px_45px_rgba(17,24,39,0.24)] transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111827]"
          >
            Start Review
          </button>
        </footer>
      </main>
    </div>
  );
}
