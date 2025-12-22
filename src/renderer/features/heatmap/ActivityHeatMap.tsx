import { useEffect, useMemo, useState } from 'react';
import type { HeatmapActivityRange } from '../../../shared/apiTypes';
import {
  buildHeatmapCells,
  buildMonthLabels,
  chunkIntoWeeks,
  sumByMode,
  type HeatmapCell,
  type HeatmapMode
} from './heatmapUtils';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export function ActivityHeatMap() {
  const [mode, setMode] = useState<HeatmapMode>('words');
  const [range, setRange] = useState<HeatmapActivityRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
  }, []);

  const cells = useMemo(() => (range ? buildHeatmapCells(range, mode) : []), [range, mode]);
  const weeks = useMemo(() => chunkIntoWeeks(cells), [cells]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);
  const totalCount = useMemo(() => sumByMode(range, mode), [range, mode]);
  const activeDays = useMemo(
    () => cells.filter((cell) => cell.count > 0 && !cell.isFuture).length,
    [cells]
  );
  const hasData = cells.some((cell) => cell.count > 0 && !cell.isFuture);

  async function loadActivity() {
    if (!window.api?.db?.getHeatmapActivity) {
      setError('Heat Map 通道不可用，请检查主进程 IPC 设置。');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await window.api.db.getHeatmapActivity();
      setRange(data);
    } catch (err) {
      setError(extractMessage(err, '加载活跃度数据失败，请稍后再试。'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel heatmap-panel">
      <div className="heatmap-header">
        <div>
          <p className="eyebrow">Heat Map</p>
          <h3>近 12 个月新增 / 复习轨迹</h3>
          <p className="muted">
            GitHub 风格 7×N 栅格，可切换新增与复习视图，颜色 5 档：0、1-3、4-7、8-15、16+。
          </p>
        </div>
        <div className="heatmap-actions">
          <div className="toggle-group" role="group" aria-label="切换 Heat Map 视图">
            <button
              type="button"
              className={`toggle ${mode === 'words' ? 'is-active' : ''}`}
              onClick={() => setMode('words')}
            >
              新增
            </button>
            <button
              type="button"
              className={`toggle ${mode === 'reviews' ? 'is-active' : ''}`}
              onClick={() => setMode('reviews')}
            >
              复习
            </button>
          </div>
          <div className="status-stack">
            <span className="badge">{`${mode === 'words' ? '累计新增' : '累计复习'} ${totalCount}`}</span>
            <span className="badge info">{`活跃日 ${activeDays}`}</span>
            <button type="button" className="ghost-button" onClick={loadActivity} disabled={loading}>
              刷新
            </button>
          </div>
        </div>
      </div>

      {range ? <p className="muted small">{formatRange(range)}</p> : null}
      {loading ? <p className="muted">加载活跃度中...</p> : null}
      {error ? <p className="badge error">{error}</p> : null}
      {!loading && !error && range ? (
        <>
          <HeatmapGrid weeks={weeks} monthLabels={monthLabels} mode={mode} />
          <Legend />
        </>
      ) : null}
      {!loading && !error && range && !hasData ? (
        <p className="muted">近 12 个月暂无活跃记录，新增或复习后方块会逐步点亮。</p>
      ) : null}
    </section>
  );
}

function HeatmapGrid({
  weeks,
  monthLabels,
  mode
}: {
  weeks: HeatmapCell[][];
  monthLabels: string[];
  mode: HeatmapMode;
}) {
  return (
    <div className="heatmap-visual" role="grid" aria-label="近 12 个月活跃度">
      <div className="heatmap-month-row">
        <span className="weekday-spacer" aria-hidden />
        <div className="month-labels">
          {monthLabels.map((label, index) => (
            <span key={`month-${index}`} className="month-label">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="heatmap-grid">
        <div className="weekday-labels" aria-hidden>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="heatmap-weeks">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="heatmap-week" role="row">
              {week.map((cell) => (
                <div
                  key={`${cell.date}-${mode}`}
                  className={`heatmap-cell level-${cell.level} ${cell.isFuture ? 'is-future' : ''}`}
                  title={`${formatFullDate(cell.date)} · ${mode === 'words' ? '新增' : '复习'} ${cell.count} 次`}
                  aria-label={`${formatFullDate(cell.date)}：${mode === 'words' ? '新增' : '复习'} ${cell.count} 次${
                    cell.isFuture ? '（未到日期）' : ''
                  }`}
                  role="gridcell"
                  data-count={cell.count}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="heatmap-legend">
      <span className="muted small">颜色档位（0 / 1-3 / 4-7 / 8-15 / 16+）</span>
      <div className="legend-swatches">
        <span className="legend-label">低</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`legend-swatch level-${level}`} aria-hidden />
        ))}
        <span className="legend-label">高</span>
      </div>
    </div>
  );
}

function formatRange(range: HeatmapActivityRange) {
  return `${formatFullDate(range.startDate)} - ${formatFullDate(range.endDate)}`;
}

function formatFullDate(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
