import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { HomeScreen } from '../screens/home_screen';
import { CardEditorScreen } from '../screens/card_editor_screen';
import { ReviewScreen } from '../screens/review_screen';
import { AnalyticsScreen } from '../screens/analytics_screen';
import { SettingsScreen } from '../screens/settings_screen';

type RouteKey = 'home' | 'editor' | 'review' | 'analytics' | 'settings';
type SecondaryRouteKey = Exclude<RouteKey, 'home'>;

const ROUTE_LABELS: Record<SecondaryRouteKey, string> = {
  editor: 'Create Card',
  review: 'Review Words',
  analytics: 'Learning Analytics',
  settings: 'Settings',
};

interface ScreenContainerProps {
  readonly title: string;
  readonly on_back: () => void;
  readonly children: ReactNode;
}

function ScreenContainer({ title, on_back, children }: ScreenContainerProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={on_back}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            aria-label="Return to home"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        </header>
        <div className="mt-6 flex-1 overflow-auto pb-8">{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('home');

  const go_home = useCallback(() => {
    set_active_route('home');
  }, []);

  const screen = useMemo(() => {
    switch (active_route) {
      case 'home':
        return (
          <HomeScreen
            on_open_analytics={() => set_active_route('analytics')}
            on_open_cards={() => set_active_route('review')}
            on_start_review={() => set_active_route('review')}
            on_create_card={() => set_active_route('editor')}
          />
        );
      case 'editor':
        return (
          <ScreenContainer title={ROUTE_LABELS.editor} on_back={go_home}>
            <CardEditorScreen />
          </ScreenContainer>
        );
      case 'review':
        return (
          <ScreenContainer title={ROUTE_LABELS.review} on_back={go_home}>
            <ReviewScreen />
          </ScreenContainer>
        );
      case 'analytics':
        return (
          <ScreenContainer title={ROUTE_LABELS.analytics} on_back={go_home}>
            <AnalyticsScreen />
          </ScreenContainer>
        );
      case 'settings':
        return (
          <ScreenContainer title={ROUTE_LABELS.settings} on_back={go_home}>
            <SettingsScreen />
          </ScreenContainer>
        );
      default:
        return null;
    }
  }, [active_route, go_home]);

  return screen;
}
