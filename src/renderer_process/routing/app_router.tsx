import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CoreHubScreen } from '../screens/core_hub_screen';
import { CardEditorScreen } from '../screens/card_editor_screen';
import { ReviewScreen } from '../screens/review_screen';

type RouteKey = 'hub' | 'editor' | 'review';
type ThemeMode = 'dark' | 'light';

interface ScreenContainerProps {
  readonly title: string;
  readonly on_back: () => void;
  readonly children: ReactNode;
  readonly content_padding?: string;
  readonly theme: ThemeMode;
  readonly on_toggle_theme: () => void;
}

function ScreenContainer({ title, on_back, children, content_padding, theme, on_toggle_theme }: ScreenContainerProps) {
  const padding_class = content_padding ?? 'px-4 py-6';
  return (
    <div className={`min-h-screen app-bg px-4 py-6 text-primary theme-${theme}`}>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col border border-app bg-surface app-frame">
        <div className="flex items-center justify-between border-b border-app bg-surface px-4 py-3 text-xs tracking-[0.25em] uppercase text-muted">
          <span>tango-card · {title}</span>
          <div className="flex items-center gap-2 text-accent-cyan">
            <span>ONLINE</span>
            <span className="text-muted">|</span>
            <span>DESKTOP</span>
          </div>
        </div>
        <header className="flex items-center justify-between border-b border-app px-4 py-3">
          <div>
            <p className="text-xs text-muted">press esc to exit</p>
            <h1 className="text-xl font-semibold tracking-tight text-primary">{title}</h1>
          </div>
          <button
            type="button"
            onClick={on_back}
            className="btn-ghost px-4 py-1 text-xs uppercase tracking-[0.2em]"
            aria-label="Return"
          >
            Back
          </button>
          <button
            type="button"
            onClick={on_toggle_theme}
            className="btn-ghost px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>
        <div className={`flex-1 overflow-auto ${padding_class}`}>{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  const [active_route, set_active_route] = useState<RouteKey>('hub');
  const [review_auto_start, set_review_auto_start] = useState(false);
  const [theme, set_theme] = useState<ThemeMode>(() => {
    if (typeof localStorage === 'undefined') {
      return 'dark';
    }
    const saved = localStorage.getItem('tango_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const go_home = useCallback(() => {
    set_active_route('hub');
    set_review_auto_start(false);
  }, []);

  const launch_review = useCallback(() => {
    set_review_auto_start(true);
    set_active_route('review');
  }, []);

  const toggle_theme = useCallback(() => {
    set_theme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tango_theme', theme);
    }
  }, [theme]);

  const screen = useMemo(() => {
    switch (active_route) {
      case 'hub':
        return (
          <CoreHubScreen
            theme={theme}
            on_toggle_theme={toggle_theme}
            on_create_card={() => set_active_route('editor')}
            on_start_review={launch_review}
          />
        );
      case 'editor':
        return (
          <ScreenContainer title="Create Card" on_back={go_home} theme={theme} on_toggle_theme={toggle_theme}>
            <CardEditorScreen />
          </ScreenContainer>
        );
      case 'review':
        return (
          <ScreenContainer
            title="Review Words"
            on_back={go_home}
            content_padding="px-4 py-2"
            theme={theme}
            on_toggle_theme={toggle_theme}
          >
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

  return <div className={`theme-${theme}`}>{screen}</div>;
}
