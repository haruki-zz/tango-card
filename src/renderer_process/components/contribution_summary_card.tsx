import type { ReactNode } from 'react';

interface ContributionSummaryCardProps {
  readonly is_loading: boolean;
  readonly streak_days: number | null;
  readonly weekly_created: number | null;
  readonly weekly_reviewed: number | null;
  readonly on_click?: () => void;
  readonly accessory?: ReactNode;
}

function render_stat(value: number | null, fallback: string): string {
  if (value === null) {
    return fallback;
  }
  return value.toString();
}

export function ContributionSummaryCard({
  is_loading,
  streak_days,
  weekly_created,
  weekly_reviewed,
  on_click,
  accessory,
}: ContributionSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={on_click}
      className="group w-full rounded-[32px] border-2 border-amber-400 bg-white/95 px-6 py-8 text-left shadow-[0px_22px_50px_rgba(26,36,58,0.12)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0px_28px_60px_rgba(26,36,58,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:translate-y-0"
    >
      <div className="flex flex-col items-center gap-3 text-center text-slate-900">
        <span className="text-lg font-semibold tracking-wide">Contribution Heat Map</span>
        {is_loading ? (
          <span className="text-sm text-slate-500">Loading activity...</span>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
            <div className="flex items-baseline gap-1 font-medium text-slate-700">
              <span>Streak</span>
              <span className="text-base font-semibold text-slate-900">
                {render_stat(streak_days, '--')}
              </span>
              <span>days</span>
            </div>
            <div className="flex items-center gap-4 text-xs uppercase tracking-wide text-slate-500">
              <span>
                New
                <span className="ml-1 font-semibold text-slate-900">
                  {render_stat(weekly_created, '0')}
                </span>
              </span>
              <span>
                Reviews
                <span className="ml-1 font-semibold text-slate-900">
                  {render_stat(weekly_reviewed, '0')}
                </span>
              </span>
            </div>
            {accessory ? accessory : null}
          </div>
        )}
      </div>
    </button>
  );
}
