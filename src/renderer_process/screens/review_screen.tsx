import { useCallback, useEffect, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_review_cycle } from '../hooks/use_review_cycle';

interface ReviewScreenProps {
  on_exit(): void;
  auto_start_round?: boolean;
}

export function ReviewScreen({ on_exit, auto_start_round = false }: ReviewScreenProps) {
  const {
    queue,
    active_card,
    active_index,
    start_round,
    submit_review,
    reset_queue,
    move_previous,
    move_next,
    update_familiarity,
  } = use_review_cycle();
  const [round_status, set_round_status] = useState<'idle' | 'loading' | 'error'>('idle');
  const [round_error, set_round_error] = useState<string | null>(null);
  const [has_started, set_has_started] = useState(false);
  const [submission_state, set_submission_state] = useState<'idle' | 'saving' | 'error'>('idle');
  const [submission_error, set_submission_error] = useState<string | null>(null);
  const [familiarity_state, set_familiarity_state] = useState<'idle' | 'saving' | 'error'>('idle');
  const [familiarity_error, set_familiarity_error] = useState<string | null>(null);

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
      const is_last_card = active_index >= queue.length - 1;
      set_submission_state('idle');
      if (is_last_card) {
        set_has_started(false);
        reset_queue();
        on_exit();
        return;
      }
      move_next();
    } catch (error) {
      set_submission_state('error');
      set_submission_error((error as Error).message);
    }
  }, [active_index, move_next, on_exit, queue.length, render_card, reset_queue, submission_state, submit_review]);

  const handle_toggle_familiarity = useCallback(async () => {
    if (!render_card || familiarity_state === 'saving') {
      return;
    }
    const next_familiarity = render_card.familiarity === 'not_familiar' ? 'normal' : 'not_familiar';
    set_familiarity_state('saving');
    set_familiarity_error(null);
    try {
      await update_familiarity(render_card.id, next_familiarity);
      set_familiarity_state('idle');
    } catch (error) {
      set_familiarity_state('error');
      set_familiarity_error((error as Error).message);
    }
  }, [familiarity_state, render_card, update_familiarity]);

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

  useEffect(() => {
    set_familiarity_state('idle');
    set_familiarity_error(null);
  }, [render_card?.id]);

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
            [← prev] [→ next/done] · {queue.length === 0 ? 0 : active_index + 1}/{queue.length}
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
            <button
              type="button"
              onClick={() => {
                void handle_toggle_familiarity();
              }}
              disabled={familiarity_state === 'saving'}
              className={`border px-3 py-1 ${
                render_card.familiarity === 'not_familiar'
                  ? 'border-[#ea580c] bg-[#1c0f08] text-[#fb923c]'
                  : 'border-[#394155] bg-[#0f131f] text-[#fcd34d]'
              } ${familiarity_state === 'saving' ? 'opacity-60' : ''}`}
            >
              {render_card.familiarity === 'not_familiar' ? 'clear not familiar' : 'mark not familiar'}
            </button>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#f97316]">
            familiarity: {render_card.familiarity === 'not_familiar' ? 'not familiar' : 'normal'}
          </div>
          {submission_state === 'saving' ? (
            <p className="mt-2 text-xs text-[#fcd34d]">Recording progress…</p>
          ) : null}
          {submission_error ? <p className="mt-2 text-xs text-red-400">Error: {submission_error}</p> : null}
          {familiarity_state === 'saving' ? (
            <p className="mt-1 text-[11px] text-[#fb923c]">Updating familiarity…</p>
          ) : null}
          {familiarity_error ? (
            <p className="mt-1 text-xs text-red-400">Familiarity update failed: {familiarity_error}</p>
          ) : null}
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
