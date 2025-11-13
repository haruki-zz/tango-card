import { useCallback, useEffect, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_review_cycle } from '../hooks/use_review_cycle';

interface ReviewScreenProps {
  on_exit(): void;
}

export function ReviewScreen({ on_exit }: ReviewScreenProps) {
  const { queue, active_card, start_round, submit_review, reset_queue } = use_review_cycle();
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

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-6 py-8 text-[#0f172a]">
      <div className="rounded-[32px] bg-[#e8ecf5] px-6 py-5 shadow-[15px_15px_35px_#d0d4de,-15px_-15px_35px_#ffffff]">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              void handle_start_round();
            }}
            disabled={round_status === 'loading'}
            className="rounded-full border border-transparent bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {round_status === 'loading' ? 'Preparing…' : 'Start review'}
          </button>
          <div className="text-sm text-[#475569]">
            <p>Cycles through your saved cards evenly. Finish a card to draw the next one.</p>
            {round_error ? <p className="text-xs text-red-600">Failed to start: {round_error}</p> : null}
          </div>
        </div>
      </div>

      {round_in_progress && render_card ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-[32px] bg-[#e8ecf5] px-4 py-4 shadow-[15px_15px_35px_#d0d4de,-15px_-15px_35px_#ffffff]">
            <SvgCanvas svg_source={render_card.svg_source} />
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
    </section>
  );
}
