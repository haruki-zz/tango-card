import type { HeatmapCell, HeatmapMetric } from '../services/analytics_builder';
import { ContributionHeatmap } from './contribution_heatmap';

interface HomeHeatmapSectionProps {
  readonly is_loading: boolean;
  readonly cells: HeatmapCell[];
  readonly selected_metric: HeatmapMetric;
  readonly on_select_metric: (metric: HeatmapMetric) => void;
  readonly weekly_created: number | null;
  readonly weekly_reviewed: number | null;
  readonly streak_days: number | null;
  readonly on_open_analytics?: () => void;
}

const METRIC_LABELS: Record<HeatmapMetric, string> = {
  total_activity: 'Total',
  created_cards: 'New',
  reviewed_cards: 'Reviews',
};

export function HomeHeatmapSection({
  is_loading,
  cells,
  selected_metric,
  on_select_metric,
  weekly_created,
  weekly_reviewed,
  streak_days,
  on_open_analytics,
}: HomeHeatmapSectionProps) {
  const has_activity = cells.length > 0 && !is_loading;

  return (
    <section className="rounded-[36px] border border-slate-200/60 bg-white/85 p-6 shadow-[0px_26px_60px_rgba(26,36,58,0.12)] backdrop-blur">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Heat Map
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Track your daily study momentum
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Switch between activity types to see how consistent you have been.
          </p>
        </div>
        {on_open_analytics ? (
          <button
            type="button"
            onClick={on_open_analytics}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0px_16px_36px_rgba(26,36,58,0.16)] transition-transform hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/80"
          >
            View Details
          </button>
        ) : null}
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(Object.keys(METRIC_LABELS) as HeatmapMetric[]).map((metric) => {
          const is_selected = metric === selected_metric;
          return (
            <button
              key={metric}
              type="button"
              onClick={() => on_select_metric(metric)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors focus:outline-none ${
                is_selected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'
              }`}
            >
              {METRIC_LABELS[metric]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] bg-slate-900/95 p-5 text-slate-50 shadow-inner">
        {is_loading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-slate-800/60" />
        ) : (
          <ContributionHeatmap cells={cells} metric={selected_metric} />
        )}
      </div>

      <footer className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-3xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Streak</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {streak_days === null ? '--' : streak_days}
          </p>
          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Days</span>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">New</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {weekly_created === null ? '--' : weekly_created}
          </p>
          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Last 7 days</span>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Reviews</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {weekly_reviewed === null ? '--' : weekly_reviewed}
          </p>
          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Last 7 days</span>
        </div>
      </footer>

      {!has_activity && !is_loading ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-500">
          No activity recorded yet—start a review session or add new cards to light up the board.
        </p>
      ) : null}
    </section>
  );
}

