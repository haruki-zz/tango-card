import { useMemo } from 'react';
import type { HeatmapCell } from '../services/analytics_builder';
import { resolve_heatmap_value } from '../services/analytics_builder';

interface HomeHeatmapCardProps {
  readonly cells: HeatmapCell[];
  readonly is_loading: boolean;
  readonly on_open_analytics?: () => void;
  readonly className?: string;
}

interface HeatmapDay {
  readonly date: Date;
  readonly iso: string;
  readonly value: number;
}

interface HeatmapColumn {
  readonly days: HeatmapDay[];
}

const MONTH_COUNT = 5;
const COLUMNS_PER_MONTH = 5;
const TOTAL_COLUMNS = MONTH_COUNT * COLUMNS_PER_MONTH;
const DAY_COUNT = 7;
const CELL_SIZE = 10;
const CELL_GAP = 2;
const COLOR_SCALE = ['#1e293b', '#fbbf24', '#34d399', '#38bdf8', '#818cf8'];
const DAY_LABELS: string[] = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABEL_HEIGHT = 40;

function to_iso_date(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function start_of_week(date: Date): Date {
  const clone = new Date(date);
  const diff = clone.getDay();
  clone.setDate(clone.getDate() - diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function end_of_week(date: Date): Date {
  const clone = new Date(date);
  const diff = 6 - clone.getDay();
  clone.setDate(clone.getDate() + diff);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

function add_days(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

function build_columns(cells: HeatmapCell[]): { columns: HeatmapColumn[]; max_value: number } {
  const scores = new Map<string, number>();
  let max_value = 0;
  cells.forEach((cell) => {
    const value = resolve_heatmap_value(cell, 'total_activity');
    scores.set(cell.date, value);
    if (value > max_value) {
      max_value = value;
    }
  });

  const today = new Date();
  const range_end = end_of_week(today);
  const range_start = start_of_week(add_days(range_end, -(TOTAL_COLUMNS * DAY_COUNT - 1)));

  const columns: HeatmapColumn[] = [];
  for (let column_index = 0; column_index < TOTAL_COLUMNS; column_index += 1) {
    const column_days: HeatmapDay[] = [];
    const week_start = add_days(range_start, column_index * DAY_COUNT);
    for (let day_offset = 0; day_offset < DAY_COUNT; day_offset += 1) {
      const current_date = add_days(week_start, day_offset);
      const iso = to_iso_date(current_date);
      const value = scores.get(iso) ?? 0;
      column_days.push({ date: current_date, iso, value });
      if (value > max_value) {
        max_value = value;
      }
    }
    columns.push({ days: column_days });
  }

  return { columns, max_value };
}

function resolve_color(value: number, max_value: number): string {
  if (max_value <= 0 || value <= 0) {
    return COLOR_SCALE[0];
  }
  const step = (COLOR_SCALE.length - 1) / max_value;
  const index = Math.min(COLOR_SCALE.length - 1, Math.max(1, Math.ceil(value * step)));
  return COLOR_SCALE[index];
}

export function HomeHeatmapCard({
  cells,
  is_loading,
  on_open_analytics,
  className,
}: HomeHeatmapCardProps) {
  const root_class = [
    'flex h-full flex-col rounded-[36px] bg-gradient-to-br from-slate-950/70 via-slate-900/50 to-slate-900/20 px-8 py-6 text-white shadow-[0_25px_65px_rgba(2,6,23,0.5)] backdrop-blur',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const layout = useMemo(() => build_columns(cells), [cells]);
  const grid_width = TOTAL_COLUMNS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const month_labels = useMemo(() => {
    const labels: Array<{ readonly text: string; readonly column_index: number }> = [];
    for (let month_index = 0; month_index < MONTH_COUNT; month_index += 1) {
      const label_column = month_index * COLUMNS_PER_MONTH + Math.floor(COLUMNS_PER_MONTH / 2);
      const column = layout.columns[label_column];
      if (!column) {
        continue;
      }
      const representative_date = column.days[0]?.date;
      if (!representative_date) {
        continue;
      }
      labels.push({
        text: MONTH_NAMES[representative_date.getMonth()],
        column_index: label_column,
      });
    }
    return labels;
  }, [layout.columns]);

  return (
    <section className={root_class}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Study Heat Map</h2>
          <p className="text-xs uppercase tracking-[0.35em] text-white/55">
            Last 5 months overview
          </p>
        </div>
        {on_open_analytics ? (
          <button
            type="button"
            onClick={on_open_analytics}
            className="rounded-full border border-white/30 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            View analytics
          </button>
        ) : null}
      </header>

      {is_loading ? (
        <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
        </div>
      ) : layout.columns.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/70">
          No activity yet. Start learning to populate your heat map.
        </p>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="mr-4 flex flex-col gap-[12px] pt-2 text-right">
            {DAY_LABELS.map((label, index) => (
              <span key={`day-${index}`} className="h-[12px] text-[11px] text-white/45">
                {label}
              </span>
            ))}
          </div>
          <div
            className="relative"
            style={{ width: `${grid_width}px`, paddingTop: `${MONTH_LABEL_HEIGHT}px` }}
          >
            <div
              className="pointer-events-none absolute left-0 top-0 w-full"
              style={{ height: `${MONTH_LABEL_HEIGHT}px` }}
            >
              {month_labels.map((label) => (
                <span
                  key={`month-${label.column_index}`}
                  className="absolute text-xs font-medium text-white/60"
                  style={{
                    left: `${label.column_index * (CELL_SIZE + CELL_GAP)}px`,
                    transform: 'translate(-50%, 20%)',
                  }}
                >
                  {label.text}
                </span>
              ))}
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${TOTAL_COLUMNS}, ${CELL_SIZE}px)`,
                columnGap: `${CELL_GAP}px`,
                rowGap: `${CELL_GAP}px`,
              }}
              role="grid"
              aria-label="Study activity heat map"
            >
              {layout.columns.map((column, column_index) =>
                column.days.map((day) => (
                  <span
                    key={`${day.iso}-${column_index}`}
                    role="gridcell"
                    aria-label={`${day.iso}: ${day.value} activities`}
                    title={`${day.iso}: ${day.value}`}
                    className="rounded-[4px]"
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      backgroundColor: resolve_color(day.value, layout.max_value),
                    }}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-white/50">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {COLOR_SCALE.map((color) => (
            <span key={color} className="h-[8px] w-[24px] rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </section>
  );
}
