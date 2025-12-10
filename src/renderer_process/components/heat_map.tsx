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
  const weekly_blocks = insert_month_gap_columns(trim_empty_columns(build_blocks_with_month_boundaries(data, columns, rows)));
  const has_activity = data.some(
    (point) => point.created_count > 0 || point.reviewed_count > 0,
  );
  const color_scale = theme === 'light' ? LIGHT_COLOR_SCALE : DARK_COLOR_SCALE;
  const month_labels = build_month_labels(weekly_blocks);
  const cell_block = 27;

  return (
    <div className="flex h-full flex-col rounded-sm bg-heat p-4">
      {!has_activity && (
        <p className="mb-2 font-mono text-xs text-muted">{EMPTY_MESSAGE}</p>
      )}
      <div className="flex-1 overflow-auto">
        <div className="relative flex flex-col gap-2 p-3">
          <div className="relative h-[18px]">
            {month_labels.map((label) => (
              <span
                key={label.index}
                className="absolute text-[10px] font-mono uppercase tracking-[0.1em] text-subtle"
                style={{
                  left: label.index * cell_block,
                  minWidth: label.span * cell_block,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <div className="flex gap-[7px]">
            {weekly_blocks.map((column, column_index) => (
              <div key={`col-${column_index}`} className="flex flex-col gap-[7px]">
                {column.map((point, row_index) =>
                  point ? (
                    <Cell key={`${column_index}-${row_index}`} point={point} color_scale={color_scale} />
                  ) : (
                    <span key={`${column_index}-${row_index}`} className="h-[20px] w-[20px] shrink-0" />
                  ),
                )}
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

function insert_month_gap_columns(blocks: Array<Array<DailyActivityPoint | null>>): Array<Array<DailyActivityPoint | null>> {
  if (blocks.length === 0) {
    return blocks;
  }
  const result: Array<Array<DailyActivityPoint | null>> = [];
  let previous_month: string | null = null;

  blocks.forEach((column) => {
    const first_point = column.find((point) => point !== null);
    const current_month = first_point ? first_point.date.slice(5, 7) : previous_month;
    if (previous_month && current_month && current_month !== previous_month) {
      result.push(Array.from({ length: column.length }, () => null));
    }
    result.push(column);
    previous_month = current_month ?? previous_month;
  });

  return result;
}

function build_blocks_with_month_boundaries(
  data: DailyActivityPoint[],
  columns: number,
  rows: number,
): Array<Array<DailyActivityPoint | null>> {
  if (data.length === 0) {
    return [];
  }

  const normalized_columns = Math.max(1, columns);
  const normalized_rows = Math.max(1, rows);
  const total_slots = normalized_columns * normalized_rows;

  const point_map = new Map<string, DailyActivityPoint>();
  data.forEach((point) => point_map.set(point.date, point));

  const last_point = data[data.length - 1];
  const last_date = parse_date(last_point.date);
  const start_date = new Date(
    Date.UTC(last_date.getUTCFullYear(), last_date.getUTCMonth(), last_date.getUTCDate() - (total_slots - 1)),
  );

  const blocks: Array<Array<DailyActivityPoint | null>> = [];
  let current_column: Array<DailyActivityPoint | null> = Array.from({ length: normalized_rows }, () => null);
  let previous_month: string | null = null;
  let previous_weekday: number | null = null;

  for (let offset = 0; offset < total_slots; offset += 1) {
    const current = add_days(start_date, offset);
    const key = format_date(current);
    const point = point_map.get(key) ?? null;
    const month_key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
    const weekday = get_weekday_index(current);

    const month_changed = previous_month !== null && month_key !== previous_month;
    const week_changed = previous_weekday !== null && weekday < previous_weekday;

    if (month_changed || week_changed) {
      blocks.push(current_column);
      current_column = Array.from({ length: normalized_rows }, () => null);
    }

    current_column[weekday] = point;
    previous_month = month_key;
    previous_weekday = weekday;
  }

  blocks.push(current_column);

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

function format_date(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parse_date(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function add_days(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function get_weekday_index(date: Date): number {
  const day = date.getUTCDay(); // Sunday = 0
  return (day + 6) % 7; // Monday = 0
}

function build_month_labels(blocks: Array<Array<DailyActivityPoint | null>>): Array<{ index: number; name: string; span: number }> {
  if (blocks.length === 0) {
    return [];
  }
  const labels: Array<{ index: number; name: string; span: number }> = [];
  let current_label: { index: number; name: string; span: number } | null = null;

  for (let col = 0; col < blocks.length; col += 1) {
    const first_point = blocks[col].find((point) => point !== null);
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

function trim_empty_columns(blocks: Array<Array<DailyActivityPoint | null>>): Array<Array<DailyActivityPoint | null>> {
  const first_filled_index = blocks.findIndex((column) => column.some((point) => point !== null));
  if (first_filled_index <= 0) {
    return blocks;
  }
  return blocks.slice(first_filled_index);
}
