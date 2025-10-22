import { useState } from 'react';
import { CardEditorScreen } from '../screens/card_editor_screen';
import { ReviewScreen } from '../screens/review_screen';
import { AnalyticsScreen } from '../screens/analytics_screen';
import { SettingsScreen } from '../screens/settings_screen';

type RouteKey = 'editor' | 'review' | 'analytics' | 'settings';

const ROUTE_LABELS: Record<RouteKey, string> = {
  editor: '创建卡片',
  review: '复习单词',
  analytics: '学习统计',
  settings: '设置',
};

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('editor');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav
        style={{
          width: '200px',
          borderRight: '1px solid #1f2937',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {Object.entries(ROUTE_LABELS).map(([route, label]) => (
          <button
            key={route}
            style={{
              backgroundColor: active_route === route ? '#1d4ed8' : '#0f172a',
            }}
            onClick={() => set_active_route(route as RouteKey)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
        {active_route === 'editor' ? <CardEditorScreen /> : null}
        {active_route === 'review' ? <ReviewScreen /> : null}
        {active_route === 'analytics' ? <AnalyticsScreen /> : null}
        {active_route === 'settings' ? <SettingsScreen /> : null}
      </main>
    </div>
  );
}
