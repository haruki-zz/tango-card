import { useMemo } from 'react';

import { useAppStore } from '../store/useAppStore';

const WEEKS_SHOWN = 5;
const DAYS_SHOWN = WEEKS_SHOWN * 7; // 可将周数改为 6 支持 42 天显示

const COLOR_BY_LEVEL = [
  'bg-panel border-border',
  'bg-leaf-50 border-leaf-100',
  'bg-leaf-100 border-leaf-200',
  'bg-leaf-200 border-leaf-300',
  'bg-leaf-400 border-leaf-500',
] as const;

const TEXT_BY_LEVEL = ['text-muted', 'text-ink', 'text-ink', 'text-ink', 'text-white'] as const;

type DayActivity = {
  date: string;
  added: number;
  sessions: number;
  total: number;
  level: number;
};

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const ActivityHeatmap = () => {
  const activity = useAppStore((state) => state.activity);

  const { days, totals } = useMemo(() => {
    const baseDate = startOfTodayUtc();
    const days: DayActivity[] = Array.from({ length: DAYS_SHOWN }, (_, index) => {
      const cursor = new Date(baseDate);
      const offset = DAYS_SHOWN - 1 - index;
      cursor.setUTCDate(baseDate.getUTCDate() - offset);
      const key = cursor.toISOString().slice(0, 10);
      const summary = activity[key] ?? { added: 0, sessions: 0 };
      const total = summary.added + summary.sessions;
      return { date: key, added: summary.added, sessions: summary.sessions, total, level: 0 };
    });

    const totals = days.reduce(
      (acc, day) => {
        acc.added += day.added;
        acc.sessions += day.sessions;
        return acc;
      },
      { added: 0, sessions: 0 },
    );

    return { days, totals };
  }, [activity]);

  const resolveLevel = (value: number) => {
    if (value === 0) {
      return 0;
    }
    if (value <= 3) {
      return 1;
    }
    if (value <= 6) {
      return 2;
    }
    if (value <= 14) {
      return 3;
    }
    return 4;
  };

  const decoratedDays = useMemo<DayActivity[]>(
    () =>
      days.map((day) => ({
        ...day,
        level: resolveLevel(day.total),
      })),
    [days],
  );

  const today = decoratedDays[decoratedDays.length - 1] ?? {
    date: new Date().toISOString().slice(0, 10),
    added: 0,
    sessions: 0,
    total: 0,
    level: 0,
  };

  return (
    <section className="surface-card" aria-label="活跃度">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">活跃度</span>
          <h2 className="text-xl font-semibold text-ink">过去 {DAYS_SHOWN} 天的新增与复习</h2>
          <p className="text-sm text-muted">
            绿色梯度：0、1–3、4–6、7–14、15+，悬停查看详细数据。
          </p>
        </div>
        <div className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-right text-xs text-muted shadow-inner">
          <p>统计区间：最近 {DAYS_SHOWN} 天</p>
          <p className="mt-1">合计新增 {totals.added} · session {totals.sessions}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-dashed border-accent-200 bg-panel px-3 py-2 shadow-inner">
          <p className="text-xs text-muted">今日合计</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{today.total}</p>
          <p className="text-[11px] text-muted">{today.date}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-sm">
          <p className="text-xs text-muted">今日新增</p>
          <p className="mt-1 text-xl font-semibold text-ink">{today.added}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-sm">
          <p className="text-xs text-muted">今日復習 session</p>
          <p className="mt-1 text-xl font-semibold text-ink">{today.sessions}</p>
        </div>
      </div>

      <div className="mt-5">
        <div
          className="grid grid-cols-7 gap-2"
          role="grid"
          aria-label="活跃度方格"
          data-testid="activity-grid"
        >
          {decoratedDays.map((day) => {
            const colorClass = COLOR_BY_LEVEL[day.level];
            const textClass = TEXT_BY_LEVEL[day.level];
            return (
              <div
                key={day.date}
                role="gridcell"
                className={`flex h-14 flex-col items-center justify-center rounded-lg border text-center text-[11px] font-semibold shadow-sm transition ${colorClass} ${textClass}`}
                title={`${day.date}｜新增 ${day.added}｜復習 ${day.sessions} sessions`}
                aria-label={`${day.date} 新增 ${day.added} 条 · 復習 ${day.sessions} 次`}
                data-level={day.level}
                data-testid={`activity-${day.date}`}
              >
                <span className="text-xs">{day.total}</span>
                <span className="text-[10px] font-medium opacity-80">{day.date.slice(5)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>较低</span>
            <div className="flex items-center gap-1">
              {COLOR_BY_LEVEL.map((color, index) => (
                <span
                  key={color}
                  className={`h-4 w-4 rounded border ${color}`}
                  aria-label={`活跃度等级 ${index}`}
                />
              ))}
            </div>
            <span>较高</span>
          </div>
          <span>统计维度：新增词条 + 复习 session</span>
        </div>
      </div>
    </section>
  );
};

export default ActivityHeatmap;
