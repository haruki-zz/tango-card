import { useCallback, useEffect, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_review_cycle } from '../hooks/use_review_cycle';

interface ReviewScreenProps {
  on_exit(): void;
  auto_start_round?: boolean;
}

export function ReviewScreen({ on_exit, auto_start_round = false }: ReviewScreenProps) {
  const { queue, active_card, start_round, submit_review, reset_queue, move_previous } = use_review_cycle();
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
        void handle_mark_reviewed();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move_previous();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [handle_mark_reviewed, move_previous, round_in_progress]);

  return (
    <section className="mx-auto w-full max-w-4xl py-0 text-[#e2e8f0]">
      {round_in_progress && render_card ? (
        <div className="w-full border border-[#1f2433] bg-[#05070d] p-4">
          <SvgCanvas
            svg_source={render_card.svg_source}
            on_swipe={(direction) => {
              if (direction === 'left') {
                void handle_mark_reviewed();
              } else if (direction === 'right') {
                move_previous();
              }
            }}
          />
          <div className="mt-3 border-t border-[#1f2433] pt-2 font-mono text-xs text-[#94a3b8]">
            [← prev] [→ mark done] · 剩余 {queue.length}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={() => {
                move_previous();
              }}
              className="border border-[#394155] bg-[#0f131f] px-3 py-1 text-[#94a3b8]"
            >
              [←] prev
            </button>
            <button
              type="button"
              onClick={() => {
                void handle_start_round();
              }}
              className="border border-[#394155] bg-[#0f131f] px-3 py-1 text-[#22d3ee]"
            >
              [R] reset
            </button>
            <button
              type="button"
              onClick={() => {
                void handle_mark_reviewed();
              }}
              className="border border-[#394155] bg-[#0f131f] px-3 py-1 text-[#f8fafc]"
            >
              [→] done
            </button>
          </div>
          {submission_state === 'saving' ? (
            <p className="mt-2 text-xs text-[#fcd34d]">Recording progress…</p>
          ) : null}
          {submission_error ? <p className="mt-2 text-xs text-red-400">Error: {submission_error}</p> : null}
          {round_error ? <p className="mt-2 text-xs text-red-400">Failed to start: {round_error}</p> : null}
        </div>
      ) : (
        <article className="border border-dashed border-[#2f3647] bg-[#05070d] px-6 py-5 text-xs text-[#94a3b8]">
          <p>No cards queued. Return to the hub to capture more words.</p>
          <button
            type="button"
            onClick={() => {
              void handle_start_round();
            }}
            className="mt-3 border border-[#394155] bg-[#0f131f] px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#22d3ee]"
          >
            [R] reset queue
          </button>
        </article>
      )}
    </section>
  );
}
