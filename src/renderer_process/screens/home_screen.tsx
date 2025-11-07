import { useEffect, useMemo, useState } from 'react';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { CardEntity } from '../../domain/card/card_entity';
import { build_heatmap_cells } from '../services/analytics_builder';
import { get_renderer_api } from '../utils/renderer_api';
import { use_card_store } from '../hooks/use_card_store';
import { use_viewport_size } from '../hooks/use_viewport_size';
import { HomeHeatmapCard } from '../components/home_heatmap_card';
import { HomeFeaturedCard } from '../components/home_featured_card';
import { HomeSearchBar } from '../components/home_search_bar';
import { HomeStatsPanel } from '../components/home_stats_panel';

const BASE_STAGE_WIDTH = 1180;
const BASE_STAGE_HEIGHT = 760;
const VIEWPORT_PADDING = 96;
const MAX_STAGE_SCALE = 1.35;

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
  const { width: viewport_width, height: viewport_height } = use_viewport_size();
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
  const recent_created = useMemo(() => {
    if (!snapshot) {
      return 0;
    }
    return snapshot.points.slice(-7).reduce((sum, point) => sum + point.created_cards, 0);
  }, [snapshot]);
  const stats_items = useMemo(
    () => [
      {
        label: 'Collection size',
        value: format_number(snapshot?.total_cards ?? total_cards),
        hint: 'Words saved so far',
      },
      {
        label: 'Daily streak',
        value: `${snapshot?.streak_days ?? 0} d`,
        hint: 'Consecutive study days',
      },
      {
        label: 'Reviews logged',
        value: format_number(snapshot?.total_reviews ?? 0),
        hint: 'Lifetime reviews recorded',
      },
      {
        label: 'New this week',
        value: format_number(recent_created),
        hint: 'Cards created over 7 days',
      },
    ],
    [recent_created, snapshot, total_cards],
  );

  const stage_scale = useMemo(() => {
    if (viewport_width <= 0 || viewport_height <= 0) {
      return 1;
    }
    const safe_width = Math.max(viewport_width - VIEWPORT_PADDING, 1);
    const safe_height = Math.max(viewport_height - VIEWPORT_PADDING, 1);
    const width_ratio = safe_width / BASE_STAGE_WIDTH;
    const height_ratio = safe_height / BASE_STAGE_HEIGHT;
    const computed_scale = Math.min(width_ratio, height_ratio);
    const clamped_scale = Math.min(computed_scale, MAX_STAGE_SCALE);
    if (!Number.isFinite(clamped_scale) || clamped_scale <= 0) {
      return Math.min(1, Math.max(width_ratio, height_ratio));
    }
    return clamped_scale;
  }, [viewport_height, viewport_width]);

  const stage_width = BASE_STAGE_WIDTH * stage_scale;
  const stage_height = BASE_STAGE_HEIGHT * stage_scale;
  const stage_style = useMemo(
    () => ({
      width: `${BASE_STAGE_WIDTH}px`,
      height: `${BASE_STAGE_HEIGHT}px`,
      transform: `scale(${stage_scale})`,
      transformOrigin: 'top left',
      top: 0,
      left: 0,
      position: 'absolute' as const,
    }),
    [stage_scale],
  );

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#020617] px-6 py-6 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 rotate-6 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_65%)]" />
        <div className="absolute inset-0 -rotate-6 bg-[radial-gradient(circle_at_30%_80%,_rgba(147,51,234,0.2),_transparent_60%)]" />
      </div>
      <div
        className="relative"
        style={{ width: `${stage_width}px`, height: `${stage_height}px` }}
      >
        <main
          className="flex flex-col rounded-[40px] border border-white/10 bg-white/[0.05] px-10 pb-10 pt-10 text-white shadow-[0_50px_140px_rgba(2,6,23,0.85)] backdrop-blur-3xl"
          style={stage_style}
        >
          <header className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Tango-card</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight">
                Build your personalized Japanese vocabulary memory palace
              </h1>
              <p className="mt-3 text-sm text-white/70">
                Manage cards, review on cadence, and visualize study momentum in one focused dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={on_open_cards}
                className="rounded-[999px] border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Browse library
              </button>
              <button
                type="button"
                onClick={on_start_review}
                disabled={!can_start_review}
                className="rounded-[999px] bg-gradient-to-r from-emerald-400 to-sky-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_15px_45px_rgba(56,189,248,0.45)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {can_start_review ? 'Start review session' : 'Add cards to start'}
              </button>
            </div>
          </header>

          <div className="mt-8 grid flex-1 grid-cols-[1.15fr_0.85fr] gap-8">
            <div className="flex flex-col gap-6">
              <HomeSearchBar
                cards={cards}
                query={search_query}
                on_query_change={set_search_query}
                on_open_cards={on_open_cards}
                on_create_card={on_create_card}
              />

              <HomeStatsPanel items={stats_items} />

              <div className="flex flex-1">
                <HomeHeatmapCard
                  className="w-full"
                  cells={heatmap_cells}
                  is_loading={is_loading_snapshot}
                  on_open_analytics={on_open_analytics}
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <HomeFeaturedCard
                className="flex-1"
                is_loading={is_cards_loading}
                card={featured_card}
                on_open_cards={on_open_cards}
              />

              {show_error ? (
                <p className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100 shadow-inner shadow-red-500/10">
                  {show_error}
                </p>
              ) : null}

              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
                <h3 className="text-base font-semibold text-white">Review tips</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-300" />
                    Refresh cards by editing their context to anchor new memories.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-300" />
                    A quick 5-minute session keeps your streak alive.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-300" />
                    Memory levels drive scheduling—log them after every card.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function format_number(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString('en-US');
}
