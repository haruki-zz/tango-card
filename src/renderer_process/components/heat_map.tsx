import type { DailyActivityPoint } from '../state/card_store';

interface HeatMapProps {
  readonly data: DailyActivityPoint[];
  readonly columns?: number;
  readonly rows?: number;
  readonly theme?: 'dark' | 'light';
}

const DARK_COLOR_SCALE = ['#ffffff', '#e2f5df', '#c7e8c0', '#9edf8f', '#63c861', '#2f9e47'];
const LIGHT_COLOR_SCALE = ['#ffffff', '#e2f5df', '#c7e8c0', '#9edf8f', '#63c861', '#2f9e47'];
const EMPTY_MESSAGE = 'No activity yet. Create or review cards to see your streak.';

export function HeatMap({ data, columns = 21, rows = 7, theme = 'dark' }: HeatMapProps) {
  const weekly_blocks = build_blocks(data, columns, rows);
  const has_activity = data.some(
    (point) => point.created_count > 0 || point.reviewed_count > 0,
  );
  const color_scale = theme === 'light' ? LIGHT_COLOR_SCALE : DARK_COLOR_SCALE;
  const month_labels = build_month_labels(data, weekly_blocks.length, rows);

  return (
    <div className="flex h-full flex-col rounded-sm bg-heat p-4">
      {!has_activity && (
        <p className="mb-2 font-mono text-xs text-muted">{EMPTY_MESSAGE}</p>
      )}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-[7px] pl-[8px]">
            {month_labels.map((label) => (
              <span
                key={label.index}
                className="text-[10px] font-mono uppercase tracking-[0.1em] text-subtle"
                style={{ minWidth: label.span * 27 }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <div className="flex gap-[7px]">
            {weekly_blocks.map((column, column_index) => (
              <div key={`col-${column_index}`} className="flex flex-col gap-[7px]">
                {column.map((point, row_index) => (
                  <Cell key={`${column_index}-${row_index}`} point={point} color_scale={color_scale} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CellProps {
  readonly point: DailyActivityPoint | null;
  readonly color_scale: string[];
}

function Cell({ point, color_scale }: CellProps) {
  const summary = point ? point.created_count + point.reviewed_count : 0;
  const color = pick_color(summary, color_scale);

  return (
    <div
      data-testid="heat-map-cell"
      className="h-[20px] w-[20px] shrink-0 rounded-[3px] border border-app shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{ backgroundColor: color, borderColor: 'var(--border)' }}
      title={point ? `${point.date}: +${point.created_count} / ↺${point.reviewed_count}` : 'No data'}
    />
  );
}

function pick_color(value: number, scale: string[]): string {
  if (value <= 0) {
    return scale[0];
  }
  if (value >= scale.length) {
    return scale[scale.length - 1];
  }
  return scale[value];
}

function build_blocks(
  data: DailyActivityPoint[],
  columns: number,
  rows: number,
): Array<Array<DailyActivityPoint | null>> {
  const normalized_columns = Math.max(1, columns);
  const normalized_rows = Math.max(1, rows);
  const blocks: Array<Array<DailyActivityPoint | null>> = [];
  const padded_data = pad_to_multiple(data, normalized_columns * normalized_rows);

  for (let col = 0; col < normalized_columns; col += 1) {
    const column: Array<DailyActivityPoint | null> = [];
    for (let row = 0; row < normalized_rows; row += 1) {
      const index = col * normalized_rows + row;
      column.push(padded_data[index] ?? null);
    }
    blocks.push(column);
  }

  return blocks;
}

function pad_to_multiple(data: DailyActivityPoint[], size: number): Array<DailyActivityPoint | null> {
  const padded: Array<DailyActivityPoint | null> = Array.from({ length: size }, () => null);
  const start = Math.max(0, data.length - size);
  const slice = data.slice(start);
  for (let i = 0; i < slice.length; i += 1) {
    padded[padded.length - slice.length + i] = slice[i];
  }
  return padded;
}

function build_month_labels(
  data: DailyActivityPoint[],
  column_count: number,
  rows: number,
): Array<{ index: number; name: string; span: number }> {
  if (data.length === 0) {
    return [];
  }
  const by_week: Array<DailyActivityPoint | null>[] = build_blocks(data, column_count, rows);
  const labels: Array<{ index: number; name: string; span: number }> = [];
  let current_label: { index: number; name: string; span: number } | null = null;

  for (let col = 0; col < by_week.length; col += 1) {
    const first_point = by_week[col].find((point) => point !== null);
    const label = first_point ? first_point.date.slice(5, 7) : '';
    if (!current_label || current_label.name !== label) {
      if (current_label) {
        labels.push(current_label);
      }
      current_label = { index: col, name: label, span: 1 };
    } else {
      current_label.span += 1;
    }
  }
  if (current_label) {
    labels.push(current_label);
  }
  return labels;
}
