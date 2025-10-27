import { useEffect, useMemo, useState } from 'react';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { CardEntity } from '../../domain/card/card_entity';
import { ContributionHeatmap } from '../components/contribution_heatmap';
import {
  aggregate_activity_totals,
  build_heatmap_cells,
  build_memory_level_distribution,
  type HeatmapMetric,
} from '../services/analytics_builder';
import { get_renderer_api } from '../utils/renderer_api';
import { MemoryLevelBadge } from '../components/memory_level_badge';

const DEFAULT_HEATMAP_METRIC: HeatmapMetric = 'total_activity';
const HEATMAP_METRIC_OPTIONS: Array<{
  readonly value: HeatmapMetric;
  readonly label: string;
  readonly description: string;
}> = [
  { value: 'total_activity', label: '综合活动', description: '新增 + 复习次数' },
  { value: 'created_cards', label: '每日新增', description: '当天新增的卡片数量' },
  { value: 'reviewed_cards', label: '复习次数', description: '当天完成的复习次数' },
];

export function AnalyticsScreen() {
  const [snapshot, set_snapshot] = useState<ActivitySnapshot | null>(null);
  const [cards, set_cards] = useState<CardEntity[]>([]);
  const [metric, set_metric] = useState<HeatmapMetric>(DEFAULT_HEATMAP_METRIC);

  useEffect(() => {
    let canceled = false;
    Promise.all([
      get_renderer_api().fetch_analytics_snapshot(),
      get_renderer_api().list_cards(),
    ])
      .then(([snapshot_data, card_list]) => {
        if (canceled) {
          return;
        }
        set_snapshot(snapshot_data);
        set_cards(card_list);
      })
      .catch(() => {
        if (canceled) {
          return;
        }
        set_snapshot(null);
        set_cards([]);
      });
    return () => {
      canceled = true;
    };
  }, []);

  const cells = useMemo(() => (snapshot ? build_heatmap_cells(snapshot) : []), [snapshot]);
  const seven_day_totals = useMemo(
    () =>
      snapshot
        ? aggregate_activity_totals(snapshot, 7)
        : { window_days: 7, created_cards: 0, reviewed_cards: 0 },
    [snapshot],
  );
  const memory_level_distribution = useMemo(
    () => build_memory_level_distribution(cards),
    [cards],
  );
  const total_cards = cards.length;

  if (!snapshot) {
    return (
      <section>
        <h2>学习统计</h2>
        <p>暂无统计数据，先创建一些单词卡吧。</p>
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2>学习统计</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <article
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>连续学习天数</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>
            {snapshot.streak_days} 天
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            保持每天的复习节奏，维持 streak 不间断。
          </p>
        </article>
        <article
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>近 7 天新增</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>
            {seven_day_totals.created_cards} 张
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            近 7 天内创建的卡片总数。
          </p>
        </article>
        <article
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>近 7 天复习</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>
            {seven_day_totals.reviewed_cards} 次
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            近 7 天完成的复习次数。
          </p>
        </article>
        <article
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>累计进度</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>
            {snapshot.total_cards} 张卡片
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>
            {snapshot.total_reviews} 次复习
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            总计创建与复习的累积数据。
          </p>
        </article>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>学习热力图</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {HEATMAP_METRIC_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set_metric(option.value)}
                aria-pressed={metric === option.value}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '9999px',
                  border: '1px solid #334155',
                  backgroundColor: metric === option.value ? '#1d4ed8' : 'transparent',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontWeight: 600 }}>{option.label}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </header>
        <ContributionHeatmap cells={cells} metric={metric} />
      </section>

      <section
        aria-labelledby="memory-level-distribution"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <h3 id="memory-level-distribution" style={{ margin: 0, fontSize: '1rem' }}>
          记忆等级分布
        </h3>
        {total_cards === 0 ? (
          <p>目前还没有卡片，先创建一些内容吧。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {memory_level_distribution.map((entry) => (
              <li
                key={entry.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MemoryLevelBadge level={entry.level} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{entry.count} 张</span>
                </div>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  {entry.percentage}
                  <span style={{ fontSize: '0.75rem' }}>%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
