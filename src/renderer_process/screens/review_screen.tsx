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
  const [active_face, set_active_face] = useState<'front' | 'back'>('front');

  const render_card = active_card;
  const round_in_progress = queue.length > 0 && Boolean(render_card);
  const active_svg_source = render_card
    ? active_face === 'front'
      ? render_card.front_svg_source
      : render_card.back_svg_source
    : '';

  const flip_card = useCallback(() => {
    set_active_face((current) => (current === 'front' ? 'back' : 'front'));
  }, []);

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
    if (!render_card) {
      return;
    }
    if (active_face === 'front') {
      set_active_face('back');
      return;
    }
    if (submission_state === 'saving') {
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
  }, [
    active_face,
    active_index,
    move_next,
    on_exit,
    queue.length,
    render_card,
    reset_queue,
    submission_state,
    submit_review,
  ]);

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
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.code === 'Space') {
        event.preventDefault();
        flip_card();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [flip_card, handle_mark_reviewed, move_previous, round_in_progress]);

  useEffect(() => {
    set_familiarity_state('idle');
    set_familiarity_error(null);
  }, [render_card?.id]);

  useEffect(() => {
    set_active_face('front');
  }, [render_card?.id]);

  return (
    <section className="mx-auto w-full max-w-4xl py-0 text-primary">
      {round_in_progress && render_card ? (
        <div className="w-full rounded-sm border border-app bg-surface p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <SvgCanvas
            svg_source={active_svg_source}
            orientation="portrait"
            on_swipe={(direction) => {
              if (direction === 'left') {
                void handle_mark_reviewed();
              } else if (direction === 'right') {
                move_previous();
              } else if (direction === 'up' || direction === 'down') {
                flip_card();
              }
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.25em] text-muted">
            <span className="rounded-full border border-app px-3 py-1 font-semibold">
              {active_face === 'front' ? 'front / word & reading' : 'back / context & example'}
            </span>
            <button
              type="button"
              onClick={flip_card}
              className="btn-ghost px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-accent-cyan"
            >
              flip card
            </button>
          </div>
          <div className="mt-3 border-t border-app pt-2 font-mono text-xs text-muted">
            [← prev] [→ next/done] · {queue.length === 0 ? 0 : active_index + 1}/{queue.length}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted">
            <button
              type="button"
              onClick={() => {
                move_previous();
              }}
              className="btn-ghost px-3 py-1 text-muted"
            >
              [←] prev
            </button>
            <button
              type="button"
              onClick={() => {
                void handle_start_round();
              }}
              className="btn-ghost px-3 py-1 text-accent-cyan"
            >
              [R] reset
            </button>
            <button
              type="button"
              onClick={() => {
                void handle_mark_reviewed();
              }}
              className="btn-ghost px-3 py-1 text-primary"
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
                  ? 'border-accent bg-card text-accent-amber'
                  : 'btn-ghost text-accent-amber'
              } ${familiarity_state === 'saving' ? 'opacity-60' : ''}`}
            >
              {render_card.familiarity === 'not_familiar' ? 'clear not familiar' : 'mark not familiar'}
            </button>
          </div>
          <div className="mt-2 text-[11px] font-mono uppercase tracking-[0.25em] text-accent-amber">
            familiarity: {render_card.familiarity === 'not_familiar' ? 'not familiar' : 'normal'}
          </div>
          {submission_state === 'saving' ? (
            <p className="mt-2 text-xs text-accent-amber">Recording progress…</p>
          ) : null}
          {submission_error ? <p className="mt-2 text-xs text-red-500">Error: {submission_error}</p> : null}
          {familiarity_state === 'saving' ? (
            <p className="mt-1 text-[11px] text-accent-amber">Updating familiarity…</p>
          ) : null}
          {familiarity_error ? (
            <p className="mt-1 text-xs text-red-500">Familiarity update failed: {familiarity_error}</p>
          ) : null}
          {round_error ? <p className="mt-2 text-xs text-red-500">Failed to start: {round_error}</p> : null}
        </div>
      ) : (
        <article className="border border-dashed border-soft bg-surface px-6 py-5 text-xs text-muted">
          <p>No cards queued. Return to the hub to capture more words.</p>
          <button
            type="button"
            onClick={() => {
              void handle_start_round();
            }}
            className="mt-3 btn-ghost px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-accent-cyan"
          >
            [R] reset queue
          </button>
        </article>
      )}
    </section>
  );
}
