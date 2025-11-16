import { useCallback, useEffect, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_review_cycle } from '../hooks/use_review_cycle';

interface ReviewScreenProps {
  on_exit(): void;
  auto_start_round?: boolean;
}

export function ReviewScreen({ on_exit, auto_start_round = false }: ReviewScreenProps) {
  const { queue, active_card, start_round, submit_review, reset_queue, move_next, move_previous } = use_review_cycle();
  const [round_status, set_round_status] = useState<'idle' | 'loading' | 'error'>('idle');
  const [round_error, set_round_error] = useState<string | null>(null);
  const [has_started, set_has_started] = useState(false);
  const [submission_state, set_submission_state] = useState<'idle' | 'saving' | 'error'>('idle');
  const [submission_error, set_submission_error] = useState<string | null>(null);

  const render_card = active_card;
  const round_in_progress = queue.length > 0 && Boolean(render_card);

  const handle_start_round = useCallback(async () => {
    set_round_status('loading');
    set_round_error(null);
    try {
      await start_round();
      set_round_status('idle');
      set_has_started(true);
    } catch (error) {
      set_round_status('error');
      set_round_error((error as Error).message);
    }
  }, [start_round]);

  const handle_mark_reviewed = useCallback(async () => {
    if (!render_card || submission_state === 'saving') {
      return;
    }
    set_submission_state('saving');
    set_submission_error(null);
    try {
      await submit_review(render_card.id);
      set_submission_state('idle');
    } catch (error) {
      set_submission_state('error');
      set_submission_error((error as Error).message);
    }
  }, [render_card, submission_state, submit_review]);

  useEffect(() => {
    if (!auto_start_round || has_started || round_status === 'loading') {
      return;
    }
    const timeout = window.setTimeout(() => {
      void handle_start_round();
    }, 0);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [auto_start_round, handle_start_round, has_started, round_status]);

  useEffect(() => {
    if (!has_started) {
      return;
    }
    if (round_in_progress) {
      return;
    }
    if (round_status === 'idle') {
      reset_queue();
      on_exit();
    }
  }, [has_started, round_in_progress, round_status, on_exit, reset_queue]);

  useEffect(() => {
    if (!round_in_progress) {
      return;
    }
    const handle_keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        move_next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move_previous();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [move_next, move_previous, round_in_progress]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-4 py-2 text-[#e2e8f0] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border border-[#1f2433] bg-[#060910] px-5 py-5 text-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-[#94a3b8]">review control</p>
        <h2 className="mt-2 text-xl font-semibold text-[#f8fafc]">queue.monitor()</h2>
        <p className="mt-2 text-xs text-[#94a3b8]">
          Run batches, mark completions, and traverse cards with ← → or swipe gestures.
        </p>
        <button
          type="button"
          onClick={() => {
            void handle_start_round();
          }}
          disabled={round_status === 'loading'}
          className="mt-4 w-full border border-[#394155] bg-[#0f131f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#22d3ee] transition hover:bg-[#151b2c] disabled:opacity-40"
        >
          {round_status === 'loading' ? 'preparing' : has_started ? 'restart round' : 'start review'}
        </button>
        <div className="mt-4 border border-[#2f3647] bg-[#05070d] p-3 text-xs text-[#94a3b8]">
          <p>
            state: <span className="text-[#e2e8f0]">{round_status === 'loading' ? 'loading' : has_started ? 'active' : 'idle'}</span>
          </p>
          <p>
            cards remaining: <span className="text-[#e2e8f0]">{round_in_progress ? queue.length : '—'}</span>
          </p>
          {round_error ? <p className="mt-2 text-red-400">error: {round_error}</p> : null}
        </div>
        <p className="mt-4 text-xs text-[#94a3b8]">Swiping left/right mirrors arrow keys for quick audits.</p>
      </aside>
      <div className="border border-[#1f2433] bg-[#090c14] px-4 py-5">
        {round_in_progress && render_card ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="border border-[#1f2433] bg-[#05070d] p-4">
              <SvgCanvas
                svg_source={render_card.svg_source}
                on_swipe={(direction) => {
                  if (direction === 'left') {
                    move_next();
                  } else if (direction === 'right') {
                    move_previous();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-3 border border-[#1f2433] bg-[#0f131f] p-4 text-sm text-[#cbd5f5]">
              <h2 className="text-base font-semibold text-[#f8fafc]">active_card</h2>
              <p className="text-xs text-[#94a3b8]">cards remaining: {queue.length}</p>
              <button
                type="button"
                onClick={() => {
                  void handle_mark_reviewed();
                }}
                disabled={submission_state === 'saving'}
                className="border border-[#394155] bg-[#111827] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f8fafc] transition hover:bg-[#1f2937] disabled:opacity-40"
              >
                {submission_state === 'saving' ? 'recording…' : 'mark reviewed'}
              </button>
              {submission_error ? (
                <p className="text-xs text-red-400">{submission_error}</p>
              ) : (
                <p className="text-xs text-[#94a3b8]">Use keyboard arrows or swipe before committing.</p>
              )}
            </div>
          </div>
        ) : (
          <article className="border border-dashed border-[#2f3647] bg-[#05070d] px-6 py-5 text-xs text-[#94a3b8]">
            <p>No active round yet. Use the control panel to draw a batch.</p>
          </article>
        )}
      </div>
    </section>
  );
}
