import { useEffect, useState } from 'react';
import type { RendererApi } from '../../preload/context_bridge';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import { ContributionHeatmap } from '../components/contribution_heatmap';
import { build_heatmap_cells } from '../services/analytics_builder';

function get_renderer_api(): RendererApi {
  if (typeof window === 'undefined' || !window.tango_api) {
    throw new Error('Renderer API is unavailable in this environment.');
  }
  return window.tango_api;
}

export function AnalyticsScreen() {
  const [snapshot, set_snapshot] = useState<ActivitySnapshot | null>(null);

  useEffect(() => {
    get_renderer_api()
      .fetch_analytics_snapshot()
      .then((data) => set_snapshot(data))
      .catch(() => set_snapshot(null));
  }, []);

  if (!snapshot) {
    return (
      <section>
        <h2>学习统计</h2>
        <p>暂无统计数据，先创建一些单词卡吧。</p>
      </section>
    );
  }

  const cells = build_heatmap_cells(snapshot);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>学习统计</h2>
      <p>当前连续学习天数：{snapshot.streak_days} 天</p>
      <p>累计卡片：{snapshot.total_cards} 张，累计复习：{snapshot.total_reviews} 次</p>
      <ContributionHeatmap cells={cells} />
    </section>
  );
}
