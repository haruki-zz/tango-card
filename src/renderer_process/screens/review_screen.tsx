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
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-6 py-8 text-[#0f172a] lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-[32px] bg-[#e8ecf5] px-6 py-6 shadow-[18px_18px_45px_#cfd3dd,-12px_-12px_35px_#ffffff]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#94a3b8]">Review control</p>
        <h2 className="mt-2 text-2xl font-semibold">Desktop cycle</h2>
        <p className="mt-2 text-sm text-[#475569]">
          Start a focused batch, keep the preview docked, and mark each card as you work through it.
        </p>
        <p className="text-xs text-[#94a3b8]">Use ← → arrow keys (or trackpad swipe) to browse queued cards.</p>
        <button
          type="button"
          onClick={() => {
            void handle_start_round();
          }}
          disabled={round_status === 'loading'}
          className="mt-5 w-full rounded-full border border-transparent bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {round_status === 'loading' ? 'Preparing…' : has_started ? 'Restart round' : 'Start review'}
        </button>
        <div className="mt-4 rounded-[28px] bg-white/80 p-4 text-sm text-[#475569] shadow-[inset_4px_4px_16px_rgba(15,23,42,0.06)]">
          <p className="font-semibold text-[#0f172a]">Cards remaining: {round_in_progress ? queue.length : '—'}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#a1acc5]">
            State: {round_status === 'loading' ? 'Loading' : has_started ? 'Active' : 'Idle'}
          </p>
          {round_error ? <p className="mt-2 text-xs text-red-600">Failed to start: {round_error}</p> : null}
        </div>
      </aside>
      <div className="rounded-[32px] bg-[#e8ecf5] px-6 py-5 shadow-[18px_18px_45px_#cfd3dd,-12px_-12px_35px_#ffffff]">
        {round_in_progress && render_card ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[32px] bg-[#e8ecf5] px-4 py-4 shadow-[15px_15px_35px_#d0d4de,-15px_-15px_35px_#ffffff]">
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
            <div className="flex flex-col gap-3 rounded-[32px] bg-[#e8ecf5] px-4 py-4 shadow-[15px_15px_35px_#d0d4de,-15px_-15px_35px_#ffffff]">
              <h2 className="text-base font-semibold">One card at a time</h2>
              <p className="text-sm text-[#475569]">Cards remaining: {queue.length}</p>
              <button
                type="button"
                onClick={() => {
                  void handle_mark_reviewed();
                }}
                disabled={submission_state === 'saving'}
                className="rounded-full border border-transparent bg-[#0f172a] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submission_state === 'saving' ? 'Recording…' : 'Mark as reviewed'}
              </button>
              {submission_error ? (
                <p className="text-xs text-red-600">{submission_error}</p>
              ) : (
                <p className="text-xs text-[#94a3b8]">Use the button above to move to the next card.</p>
              )}
            </div>
          </div>
        ) : (
          <article className="rounded-[32px] border border-dashed border-[#d1d5db] bg-white px-6 py-5 text-sm text-[#4b5563] shadow-sm">
            <p>No active round yet. Press “Start review” to draw a batch of cards.</p>
          </article>
        )}
      </div>
    </section>
  );
}
