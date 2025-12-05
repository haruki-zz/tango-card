import { useEffect, useMemo } from 'react';
import { use_card_store } from '../hooks/use_card_store';
import { HeatMap } from '../components/heat_map';
import { use_element_size } from '../hooks/use_element_size';
import { use_window_size } from '../hooks/use_window_size';

interface CoreHubScreenProps {
  on_create_card(): void;
  on_start_review(): void;
  theme: 'dark' | 'light';
  on_toggle_theme(): void;
}

export function CoreHubScreen({ on_create_card, on_start_review, theme, on_toggle_theme }: CoreHubScreenProps) {
  const { cards, is_loading, daily_activity, set_activity_window, activity_window_days } = use_card_store();
  const { attach_ref, size } = use_element_size();
  const { width: viewport_width } = use_window_size();
  const total_cards = cards.length;
  const pending_reviews = cards.filter((card) => card.review_count === 0).length;
  const columns = useMemo(() => {
    const cell_block = 27; // 20px cell + 7px gap
    const available = Math.max(size.width, viewport_width);
    return Math.max(10, Math.floor(available / cell_block));
  }, [size.width, viewport_width]);
  const target_window_days = useMemo(() => Math.min(365, columns * 7), [columns]);

  useEffect(() => {
    if (activity_window_days !== target_window_days) {
      set_activity_window(target_window_days);
    }
  }, [activity_window_days, set_activity_window, target_window_days]);

  useEffect(() => {
    const handle_keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        on_start_review();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        on_create_card();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [on_create_card, on_start_review]);

  return (
    <div className={`min-h-screen w-full app-bg px-4 py-6 text-primary theme-${theme}`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full flex-col rounded-sm border border-app bg-surface app-frame">
        <header className="flex items-center justify-between border-b border-app px-4 py-3 text-xs uppercase tracking-[0.3em] text-muted">
          <span>tango-card // two commands</span>
          <button
            type="button"
            onClick={on_toggle_theme}
            className="btn-ghost px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="grid shrink-0 gap-5 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-sm border border-app bg-surface-strong p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-accent-cyan">status</p>
              <div className="mt-4 grid gap-2 font-mono text-sm text-primary">
                <div className="flex items-center justify-between rounded-sm bg-muted-panel px-3 py-2">
                  <span className="text-subtle">cards_saved</span>
                  <span className="text-primary">
                    {is_loading ? '···' : total_cards.toString().padStart(3, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-muted-panel px-3 py-2">
                  <span className="text-subtle">pending_revs</span>
                  <span className="text-primary">
                    {is_loading ? '···' : pending_reviews.toString().padStart(3, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-muted-panel px-3 py-2">
                  <span className="text-subtle">state</span>
                  <span className="text-accent-cyan">{total_cards === 0 ? 'idle' : 'ready'}</span>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-3 rounded-sm border border-app bg-card p-4 text-sm text-primary">
              <p className="text-xs uppercase tracking-[0.35em] text-muted">commands</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={on_create_card}
                  className="flex w-full items-center justify-between rounded-[3px] border border-soft bg-card px-4 py-3 text-left font-mono tracking-wide text-accent-cyan transition hover:border-accent hover:text-accent-cyan"
                >
                  <span>&gt; create_card --new</span>
                  <span className="text-[10px] text-subtle">ENTER</span>
                </button>
                <button
                  type="button"
                  onClick={on_start_review}
                  className="flex w-full items-center justify-between rounded-[3px] border border-soft bg-card px-4 py-3 text-left font-mono tracking-wide text-accent-amber transition hover:border-accent"
                >
                  <span>&gt; review_session --start</span>
                  <span className="text-[10px] text-subtle">SHIFT + ENTER</span>
                </button>
              </div>
              <p className="text-[11px] text-subtle">
                stay minimal: focus on add / review and keep streak in motion.
              </p>
            </section>
          </div>
          <section className="flex flex-1 min-h-0 flex-col gap-3 border-t border-app bg-surface px-5 pb-6 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">activity heat map</p>
                <p className="mt-1 text-[11px] text-subtle">auto-scales with window size</p>
              </div>
              <p className="text-[11px] font-mono text-accent-cyan">{target_window_days} days</p>
            </div>
            <div
              ref={attach_ref}
              className="flex-1 min-h-[420px] w-full rounded-sm border border-app bg-heat p-3"
            >
              <HeatMap data={daily_activity} columns={columns} rows={7} theme={theme} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
