import type { DailyActivityPoint } from '../state/card_store';

interface HeatMapProps {
  readonly data: DailyActivityPoint[];
  readonly columns?: number;
  readonly rows?: number;
}

const COLOR_SCALE = ['#1c2843', '#233659', '#2a4871', '#2563eb', '#38bdf8', '#a5f3fc'];
const EMPTY_MESSAGE = 'No activity yet. Create or review cards to see your streak.';

export function HeatMap({ data, columns = 21, rows = 7 }: HeatMapProps) {
  const weekly_blocks = build_blocks(data, columns, rows);
  const has_activity = data.some(
    (point) => point.created_count > 0 || point.reviewed_count > 0,
  );

  return (
    <div className="rounded-sm bg-[#0b111c] p-2">
      {!has_activity && (
        <p className="mb-2 font-mono text-xs text-[#94a3b8]">{EMPTY_MESSAGE}</p>
      )}
      <div className="overflow-auto">
        <div className="flex gap-1">
          {weekly_blocks.map((column, column_index) => (
            <div key={`col-${column_index}`} className="flex flex-col gap-1">
              {column.map((point, row_index) => (
                <Cell key={`${column_index}-${row_index}`} point={point} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CellProps {
  readonly point: DailyActivityPoint | null;
}

function Cell({ point }: CellProps) {
  const summary = point ? point.created_count + point.reviewed_count : 0;
  const color = pick_color(summary);

  return (
    <div
      className="h-4 w-4 shrink-0 rounded-[2px] border border-[#26334a] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{ backgroundColor: color }}
      title={point ? `${point.date}: +${point.created_count} / ↺${point.reviewed_count}` : 'No data'}
    />
  );
}

function pick_color(value: number): string {
  if (value <= 0) {
    return COLOR_SCALE[0];
  }
  if (value >= COLOR_SCALE.length) {
    return COLOR_SCALE[COLOR_SCALE.length - 1];
  }
  return COLOR_SCALE[value];
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
