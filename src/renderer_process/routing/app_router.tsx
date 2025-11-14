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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-6 rounded-[32px] border border-white/12 bg-slate-900/70 px-4 pb-10 pt-6 shadow-[0_30px_75px_rgba(15,23,42,0.75)] lg:px-10">
        <header className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={on_back}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-lg text-white transition hover:border-white/60"
            aria-label="Return"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-white/70">Optimized for keyboard + mouse flow on larger screens.</p>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('hub');

  const go_home = useCallback(() => {
    set_active_route('hub');
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
