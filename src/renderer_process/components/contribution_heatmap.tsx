import { Fragment, useMemo } from 'react';
import type { HeatmapCell } from '../services/analytics_builder';

interface ContributionHeatmapProps {
  readonly cells: HeatmapCell[];
}

interface HeatmapDay {
  readonly date: string;
  readonly score: number;
  readonly date_object: Date;
}

interface HeatmapWeek {
  readonly days: HeatmapDay[];
  readonly month_label: string;
}

interface HeatmapLayout {
  readonly weeks: HeatmapWeek[];
  readonly max_score: number;
}

const CELL_SIZE = 14;
const WEEK_GAP = 3;
const COLUMN_LABEL_WIDTH = 48;
const DEFAULT_WEEK_RANGE = 20;
const COLOR_SCALE = ['#1f2937', '#84cc16', '#22c55e', '#16a34a', '#15803d'];
const WEEKDAY_LABELS: Array<{ readonly label: string; readonly visible: boolean }> = [
  { label: '周日', visible: true },
  { label: '', visible: false },
  { label: '周二', visible: true },
  { label: '', visible: false },
  { label: '周四', visible: true },
  { label: '', visible: false },
  { label: '周六', visible: true },
];

function parse_iso_date(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function format_iso_date(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function start_of_week(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function end_of_week(date: Date): Date {
  const end = new Date(date);
  const day = end.getDay();
  end.setDate(end.getDate() + (6 - day));
  end.setHours(0, 0, 0, 0);
  return end;
}

function add_days(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function build_heatmap_layout(cells: HeatmapCell[]): HeatmapLayout {
  if (cells.length === 0) {
    const end = end_of_week(new Date());
    const start = start_of_week(add_days(end, -(DEFAULT_WEEK_RANGE * 7 - 1)));
    return build_layout_from_range(new Map(), start, end);
  }

  const sorted = [...cells].sort((left, right) => (left.date < right.date ? -1 : 1));
  const scores = new Map<string, number>();
  let max_score = 0;
  sorted.forEach((cell) => {
    scores.set(cell.date, cell.score);
    if (cell.score > max_score) {
      max_score = cell.score;
    }
  });

  const min_cell_date = parse_iso_date(sorted[0].date);
  const max_cell_date = parse_iso_date(sorted[sorted.length - 1].date);

  const target_end = end_of_week(max_cell_date);
  const minimum_start = start_of_week(min_cell_date);
  const default_start_candidate = start_of_week(add_days(target_end, -(DEFAULT_WEEK_RANGE * 7 - 1)));
  const target_start =
    minimum_start.getTime() < default_start_candidate.getTime() ? minimum_start : default_start_candidate;

  const layout = build_layout_from_range(scores, target_start, target_end);

  return {
    weeks: layout.weeks,
    max_score: Math.max(max_score, layout.max_score),
  };
}

function build_layout_from_range(
  scores: Map<string, number>,
  start: Date,
  end: Date,
): HeatmapLayout {
  const weeks: HeatmapWeek[] = [];
  let current_week: HeatmapDay[] = [];
  let cursor = new Date(start);
  let max_score = 0;
  const month_formatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
  let last_labeled_month = -1;

  while (cursor.getTime() <= end.getTime()) {
    const iso = format_iso_date(cursor);
    const score = scores.get(iso) ?? 0;
    const date_object = new Date(cursor);
    current_week.push({ date: iso, score, date_object });
    if (score > max_score) {
      max_score = score;
    }

    if (current_week.length === 7) {
      const month_candidate = current_week.find((day) => day.date_object.getDate() <= 7);
      const month_index = month_candidate ? month_candidate.date_object.getMonth() : -1;
      let month_label = '';
      if (month_candidate && month_index !== last_labeled_month) {
        month_label = month_formatter.format(month_candidate.date_object);
        last_labeled_month = month_index;
      }
      weeks.push({ days: current_week, month_label });
      current_week = [];
    }

    cursor = add_days(cursor, 1);
  }

  if (current_week.length > 0) {
    let filler_cursor = new Date(cursor);
    while (current_week.length < 7) {
      const date_object = new Date(filler_cursor);
      current_week.push({
        date: format_iso_date(date_object),
        score: 0,
        date_object,
      });
      filler_cursor = add_days(filler_cursor, 1);
    }
    const month_candidate = current_week.find((day) => day.date_object.getDate() <= 7);
    const month_index = month_candidate ? month_candidate.date_object.getMonth() : -1;
    let month_label = '';
    if (month_candidate && month_index !== last_labeled_month) {
      month_label = month_formatter.format(month_candidate.date_object);
      last_labeled_month = month_index;
    }
    weeks.push({ days: current_week, month_label });
  }

  return { weeks, max_score };
}

function resolve_cell_color(score: number, max_score: number): string {
  if (max_score <= 0 || score <= 0) {
    return COLOR_SCALE[0];
  }
  const step = (COLOR_SCALE.length - 1) / max_score;
  const index = Math.min(COLOR_SCALE.length - 1, Math.max(1, Math.ceil(score * step)));
  return COLOR_SCALE[index];
}

export function ContributionHeatmap({ cells }: ContributionHeatmapProps) {
  const layout = useMemo(() => build_heatmap_layout(cells), [cells]);
  const has_activity = layout.max_score > 0;

  if (layout.weeks.length === 0) {
    return <p>目前暂无学习记录。</p>;
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!has_activity ? <p>最近暂无学习记录，开始一轮复习吧！</p> : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.weeks.length}, ${CELL_SIZE}px)`,
          columnGap: `${WEEK_GAP}px`,
          marginLeft: `${COLUMN_LABEL_WIDTH}px`,
        }}
      >
        {layout.weeks.map((week, index) => (
          <span
            key={`month-${week.days[0].date}-${index}`}
            data-testid="month-label"
            style={{
              fontSize: '0.75rem',
              color: '#cbd5f5',
              textAlign: 'left',
            }}
          >
            {week.month_label}
          </span>
        ))}
      </div>
      <div
        role="grid"
        aria-label="学习进度热力图"
        style={{
          display: 'grid',
          gridTemplateColumns: `${COLUMN_LABEL_WIDTH}px repeat(${layout.weeks.length}, ${CELL_SIZE}px)`,
          columnGap: `${WEEK_GAP}px`,
          rowGap: `${WEEK_GAP}px`,
        }}
      >
        {WEEKDAY_LABELS.map((weekday, row_index) => (
          <Fragment key={`weekday-${row_index}`}>
            <span
              role="rowheader"
              style={{
                fontSize: '0.75rem',
                color: weekday.visible ? '#cbd5f5' : 'transparent',
              }}
            >
              {weekday.visible ? weekday.label : '·'}
            </span>
            {layout.weeks.map((week, column_index) => {
              const day = week.days[row_index];
              const color = resolve_cell_color(day.score, layout.max_score);
              return (
                <span
                  key={`${day.date}-${column_index}`}
                  role="gridcell"
                  aria-label={`${day.date}：${day.score} 次学习活动`}
                  title={`${day.date}: ${day.score}`}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    borderRadius: '3px',
                    backgroundColor: color,
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <footer
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: '#cbd5f5',
        }}
      >
        <span>学习频率</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>较少</span>
          {COLOR_SCALE.map((color, index) => (
            <span
              key={`legend-${color}-${index}`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                borderRadius: '3px',
                backgroundColor: color,
              }}
            />
          ))}
          <span>较多</span>
        </div>
      </footer>
    </section>
  );
}
