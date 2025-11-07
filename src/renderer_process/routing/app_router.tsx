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
    <div className="min-h-screen bg-[#020617] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col rounded-[32px] border border-white/10 bg-white/5 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] shadow-[0_35px_90px_rgba(2,6,23,0.7)] backdrop-blur">
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={on_back}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg text-white/90 transition hover:border-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Return to home"
          >
            ←
          </button>
          <h1 className="text-2xl font-semibold">{title}</h1>
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
            <ReviewScreen on_exit={go_home} />
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
