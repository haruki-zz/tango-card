import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CoreHubScreen } from '../screens/core_hub_screen';
import { CardEditorScreen } from '../screens/card_editor_screen';
import { ReviewScreen } from '../screens/review_screen';

type RouteKey = 'hub' | 'editor' | 'review';

interface ScreenContainerProps {
  readonly title: string;
  readonly on_back: () => void;
  readonly children: ReactNode;
}

function ScreenContainer({ title, on_back, children }: ScreenContainerProps) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-4 rounded-[24px] border border-white/15 bg-slate-900/70 px-6 pb-8 pt-6 shadow-[0_20px_60px_rgba(15,23,42,0.65)]">
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={on_back}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white transition hover:border-white/60"
            aria-label="Return"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('hub');

  const go_home = useCallback(() => {
    set_active_route('home');
  }, []);

  const screen = useMemo(() => {
    switch (active_route) {
      case 'hub':
        return (
          <CoreHubScreen
            on_create_card={() => set_active_route('editor')}
            on_start_review={() => set_active_route('review')}
          />
        );
      case 'editor':
        return (
          <ScreenContainer title="Create Card" on_back={go_home}>
            <CardEditorScreen />
          </ScreenContainer>
        );
      case 'review':
        return (
          <ScreenContainer title="Review Words" on_back={go_home}>
            <ReviewScreen on_exit={go_home} />
          </ScreenContainer>
        );
      default:
        return null;
    }
  }, [active_route, go_home]);

  return screen;
}
