import { useEffect, useMemo, useState } from 'react';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { CardEntity } from '../../domain/card/card_entity';
import { ContributionHeatmap } from '../components/contribution_heatmap';
import {
  aggregate_activity_totals,
  build_heatmap_cells,
  build_memory_level_distribution,
  type HeatmapMetric,
} from '../services/analytics_builder';
import { get_renderer_api } from '../utils/renderer_api';
import { MemoryLevelBadge } from '../components/memory_level_badge';

const DEFAULT_HEATMAP_METRIC: HeatmapMetric = 'total_activity';
const HEATMAP_METRIC_OPTIONS: Array<{
  readonly value: HeatmapMetric;
  readonly label: string;
  readonly description: string;
}> = [
  { value: 'total_activity', label: 'Total Activity', description: 'New cards + reviews' },
  { value: 'created_cards', label: 'Cards Created', description: 'Cards added on that day' },
  { value: 'reviewed_cards', label: 'Cards Reviewed', description: 'Reviews completed on that day' },
];

export function AnalyticsScreen() {
  const [snapshot, set_snapshot] = useState<ActivitySnapshot | null>(null);
  const [cards, set_cards] = useState<CardEntity[]>([]);
  const [metric, set_metric] = useState<HeatmapMetric>(DEFAULT_HEATMAP_METRIC);

  useEffect(() => {
    let canceled = false;
    Promise.all([
      get_renderer_api().fetch_analytics_snapshot(),
      get_renderer_api().list_cards(),
    ])
      .then(([snapshot_data, card_list]) => {
        if (canceled) {
          return;
        }
        set_snapshot(snapshot_data);
        set_cards(card_list);
      })
      .catch(() => {
        if (canceled) {
          return;
        }
        set_snapshot(null);
        set_cards([]);
      });
    return () => {
      canceled = true;
    };
  }, []);

  const cells = useMemo(() => (snapshot ? build_heatmap_cells(snapshot) : []), [snapshot]);
  const seven_day_totals = useMemo(
    () =>
      snapshot
        ? aggregate_activity_totals(snapshot, 7)
        : { window_days: 7, created_cards: 0, reviewed_cards: 0 },
    [snapshot],
  );
  const memory_level_distribution = useMemo(
    () => build_memory_level_distribution(cards),
    [cards],
  );
  const total_cards = cards.length;

  if (!snapshot) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_25px_60px_rgba(2,6,23,0.55)]">
        <h2 className="text-2xl font-semibold">Learning analytics</h2>
        <p className="mt-2 text-sm text-white/70">No analytics yet—create a few cards to get started.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 text-white">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">Insights</p>
        <h2 className="text-3xl font-semibold">Learning analytics</h2>
        <p className="text-sm text-white/70">
          Track your streak, weekly throughput, and how reviews distribute across memory levels.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsStatCard title="Streak" value={`${snapshot.streak_days} days`} hint="Keep the habit going." />
        <AnalyticsStatCard
          title="Cards created (7d)"
          value={`${seven_day_totals.created_cards.toLocaleString()} cards`}
          hint="New additions this week."
        />
        <AnalyticsStatCard
          title="Cards reviewed (7d)"
          value={`${seven_day_totals.reviewed_cards.toLocaleString()} reviews`}
          hint="Completed sessions this week."
        />
        <AnalyticsStatCard
          title="Lifetime totals"
          value={`${snapshot.total_cards.toLocaleString()} cards`}
          secondary={`${snapshot.total_reviews.toLocaleString()} reviews`}
          hint="All-time progress."
        />
      </div>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(2,6,23,0.55)] backdrop-blur">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Activity heatmap</h3>
            <p className="text-sm text-white/60">Switch metrics to compare creation and review cadence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HEATMAP_METRIC_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set_metric(option.value)}
                aria-pressed={metric === option.value}
                className={`rounded-[999px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                  metric === option.value
                    ? 'border-sky-300/60 bg-sky-500/20 text-sky-100'
                    : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>
        <div className="mt-6">
          <ContributionHeatmap cells={cells} metric={metric} />
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(2,6,23,0.55)] backdrop-blur">
        <h3 id="memory-level-distribution" className="text-lg font-semibold">
          Memory-level breakdown
        </h3>
        {total_cards === 0 ? (
          <p className="mt-2 text-sm text-white/70">No cards yet—add something to see the distribution.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {memory_level_distribution.map((entry) => (
              <li
                key={entry.level}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <MemoryLevelBadge level={entry.level} />
                  <span className="text-xl font-semibold">{entry.count} cards</span>
                </div>
                <span className="text-sm text-white/70">
                  {entry.percentage}
                  <span className="text-xs">%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

interface AnalyticsStatCardProps {
  readonly title: string;
  readonly value: string;
  readonly secondary?: string;
  readonly hint: string;
}

function AnalyticsStatCard({ title, value, secondary, hint }: AnalyticsStatCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_45px_rgba(2,6,23,0.45)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {secondary ? <p className="text-lg font-semibold text-white/80">{secondary}</p> : null}
      <p className="mt-2 text-xs text-white/60">{hint}</p>
    </article>
  );
}
