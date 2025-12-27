import { useMemo } from 'react';

import { useAppStore } from '../store/useAppStore';

const DAYS_SHOWN = 35;

const COLOR_BY_LEVEL = [
  'bg-slate-100 border-slate-200',
  'bg-accent-50 border-accent-100',
  'bg-accent-100 border-accent-200',
  'bg-accent-200 border-accent-300',
  'bg-accent-400 border-accent-500',
] as const;

const TEXT_BY_LEVEL = [
  'text-muted',
  'text-ink',
  'text-ink',
  'text-ink',
  'text-white',
] as const;

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

  const { days, totals, maxValue } = useMemo(() => {
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

    const maxValue = days.reduce((max, day) => Math.max(max, day.total), 0);
    const totals = days.reduce(
      (acc, day) => {
        acc.added += day.added;
        acc.sessions += day.sessions;
        return acc;
      },
      { added: 0, sessions: 0 },
    );

    return { days, totals, maxValue };
  }, [activity]);

  const resolveLevel = (value: number) => {
    if (maxValue === 0 || value === 0) {
      return 0;
    }
    const scaled = Math.ceil((value / maxValue) * 4);
    return Math.max(1, Math.min(scaled, 4));
  };

  const decoratedDays = useMemo<DayActivity[]>(
    () =>
      days.map((day) => ({
        ...day,
        level: resolveLevel(day.total),
      })),
    [days, maxValue],
  );

  return (
    <section className="surface-card" aria-label="活跃度">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">活跃度</span>
          <h2 className="text-xl font-semibold text-ink">过去 {DAYS_SHOWN} 天的新增与复习</h2>
          <p className="text-sm text-muted">
            绿色越深表示当天的新增词条与复习 session 总和越多，悬停查看具体数字。
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right text-sm text-ink shadow-inner">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted">新增词条</span>
              <span className="text-lg font-semibold text-ink">{totals.added}</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-xs text-muted">复习 session</span>
              <span className="text-lg font-semibold text-ink">{totals.sessions}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">统计区间：最近 {DAYS_SHOWN} 天</p>
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
                title={`${day.date} 新增 ${day.added} · 复习 ${day.sessions}`}
                aria-label={`${day.date} 新增 ${day.added} 条 · 复习 ${day.sessions} 次`}
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
