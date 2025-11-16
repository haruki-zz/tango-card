import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    <div className="min-h-screen bg-[#05060b] px-4 py-6 text-[#e2e8f0]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col border border-[#272b3a] bg-[#090c14] shadow-[0_0_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-[#272b3a] bg-[#0f131d] px-4 py-3 text-xs tracking-[0.25em] uppercase text-[#94a3b8]">
          <span>tango-card · {title}</span>
          <div className="flex items-center gap-2 text-[#22d3ee]">
            <span>ONLINE</span>
            <span className="text-[#9ca3af]">|</span>
            <span>DESKTOP</span>
          </div>
        </div>
        <header className="flex items-center justify-between border-b border-[#272b3a] px-4 py-3">
          <div>
            <p className="text-xs text-[#94a3b8]">press esc to exit</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f1f5f9]">{title}</h1>
          </div>
          <button
            type="button"
            onClick={on_back}
            className="border border-[#40465a] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[#e2e8f0] transition hover:bg-[#111524]"
            aria-label="Return"
          >
            Back
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-6">{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('hub');
  const [review_auto_start, set_review_auto_start] = useState(false);

  const go_home = useCallback(() => {
    set_active_route('hub');
    set_review_auto_start(false);
  }, []);

  const launch_review = useCallback(() => {
    set_review_auto_start(true);
    set_active_route('review');
  }, []);

  const screen = useMemo(() => {
    switch (active_route) {
      case 'hub':
        return (
          <CoreHubScreen
            on_create_card={() => set_active_route('editor')}
            on_start_review={launch_review}
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
            <ReviewScreen on_exit={go_home} auto_start_round={review_auto_start} />
          </ScreenContainer>
        );
      default:
        return null;
    }
  }, [active_route, go_home, launch_review, review_auto_start]);

  useEffect(() => {
    if (active_route === 'hub') {
      return;
    }
    const handle_key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        go_home();
      }
    };
    window.addEventListener('keydown', handle_key);
    return () => {
      window.removeEventListener('keydown', handle_key);
    };
  }, [active_route, go_home]);

  return screen;
}
