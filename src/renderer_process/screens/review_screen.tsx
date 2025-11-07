import { useEffect, useMemo, useCallback, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';

interface ReviewScreenProps {
  on_exit(): void;
}

export function ReviewScreen({ on_exit }: ReviewScreenProps) {
  const { queue, active_card, start_round, submit_review, reset_queue } = use_review_cycle();

  const render_card = active_card;
  const [selected_level, set_selected_level] = useState<MemoryLevel>(MEMORY_LEVEL_DEFAULT);
  const [submission_status, set_submission_status] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [feedback_message, set_feedback_message] = useState<string | null>(null);
  const [is_submitting, set_is_submitting] = useState(false);
  const [round_status, set_round_status] = useState<'idle' | 'loading' | 'error'>('idle');
  const [round_error, set_round_error] = useState<string | null>(null);
  const [has_started, set_has_started] = useState(false);

  const selected_option = useMemo(
    () => MEMORY_LEVEL_OPTIONS.find((option) => option.level === selected_level),
    [selected_level],
  );

  const shortcut_map = useMemo(() => {
    return MEMORY_LEVEL_OPTIONS.reduce<Record<string, typeof MEMORY_LEVEL_OPTIONS[number]>>(
      (accumulator, option) => {
        const register = (value: string) => {
          accumulator[value.toLowerCase()] = option;
        };
        register(option.shortcut);
        if (option.alt_shortcuts) {
          option.alt_shortcuts.forEach(register);
        }
        return accumulator;
      },
      {},
    );
  }, []);

  useEffect(() => {
    if (!render_card) {
      return;
    }
    set_selected_level(render_card.memory_level ?? MEMORY_LEVEL_DEFAULT);
    set_submission_status('idle');
    set_feedback_message(null);
    set_is_submitting(false);
  }, [render_card]);

  const perform_submission = useCallback(
    async (card_id: string, level: MemoryLevel) => {
      if (is_submitting) {
        return;
      }
      set_is_submitting(true);
      set_submission_status('saving');
      set_feedback_message('Submitting...');
      try {
        await submit_review(card_id, level);
        set_submission_status('success');
        set_feedback_message('Memory level recorded.');
      } catch (error) {
        set_submission_status('error');
        set_feedback_message(`Submission failed: ${(error as Error).message}`);
      } finally {
        set_is_submitting(false);
      }
    },
    [is_submitting, submit_review],
  );

  useEffect(() => {
    if (!render_card) {
      return undefined;
    }
    const handle_keydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mapping = shortcut_map[key];
      if (!mapping) {
        return;
      }
      event.preventDefault();
      set_selected_level(mapping.level);
      void perform_submission(render_card.id, mapping.level);
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [perform_submission, render_card, shortcut_map]);

  const handle_swipe = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (!render_card) {
        return;
      }
      let target_option: (typeof MEMORY_LEVEL_OPTIONS)[number] | undefined;
      switch (direction) {
        case 'left':
          target_option = MEMORY_LEVEL_OPTIONS[MEMORY_LEVEL_OPTIONS.length - 1];
          break;
        case 'right':
          target_option = MEMORY_LEVEL_OPTIONS[0];
          break;
        case 'up':
        case 'down':
          target_option = MEMORY_LEVEL_OPTIONS[1] ?? MEMORY_LEVEL_OPTIONS[0];
          break;
        default:
          target_option = undefined;
          break;
      }
      if (!target_option) {
        return;
      }
      set_selected_level(target_option.level);
      void perform_submission(render_card.id, target_option.level);
    },
    [perform_submission, render_card],
  );

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

  const round_in_progress = queue.length > 0 && Boolean(render_card);

  useEffect(() => {
    if (has_started) {
      return;
    }
    if (round_status !== 'idle') {
      return;
    }
    void handle_start_round();
  }, [handle_start_round, has_started, round_status]);

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
    <section className="flex flex-col gap-6 text-white">
      <header className="flex flex-wrap items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
        <button
          type="button"
          onClick={() => {
            void handle_start_round();
          }}
          disabled={round_status === 'loading'}
          className="rounded-[999px] bg-gradient-to-r from-emerald-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_15px_35px_rgba(56,189,248,0.35)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-progress disabled:opacity-60"
        >
          {round_status === 'loading' ? 'Preparing...' : 'Start review'}
        </button>
        <div className="flex flex-1 flex-col text-sm text-white/70">
          <span>
            Each round pulls up to 30 cards with a 1:3:6 ratio (Well Known / Somewhat Familiar / Needs Reinforcement).
          </span>
          {round_error ? <span className="text-xs text-red-300">Failed to start review: {round_error}</span> : null}
        </div>
      </header>

      {round_in_progress && render_card ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(2,6,23,0.55)] backdrop-blur">
            <SvgCanvas svg_source={render_card.svg_source} on_swipe={handle_swipe} />
          </div>
          <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(2,6,23,0.55)] backdrop-blur">
            <h2 className="text-xl font-semibold">Memory strength</h2>
            <div className="space-y-2 text-sm text-white/70">
              <p>Last recorded</p>
              <MemoryLevelBadge level={render_card.memory_level} />
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <p>Current selection</p>
              <MemoryLevelBadge level={selected_level} />
            </div>
            <p className="text-sm text-white/70">Cards remaining: {queue.length}</p>
            <p className="text-xs text-white/50">
              Keyboard shortcuts 1/2/3 or arrow keys submit instantly. Swiping the card works as well.
            </p>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-white/80">Memory level</span>
              <select
                value={selected_level}
                disabled={is_submitting}
                onChange={(event) => {
                  set_selected_level(event.target.value as MemoryLevel);
                  set_submission_status('idle');
                  set_feedback_message(null);
                }}
                className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white/90 focus:border-sky-400 focus:outline-none disabled:opacity-60"
              >
                {MEMORY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.level} value={option.level} className="bg-slate-900 text-slate-100">
                    {option.label} (Shortcut: {[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' / ')})
                  </option>
                ))}
              </select>
              {selected_option?.description ? (
                <span className="text-xs text-white/60">{selected_option.description}</span>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => {
                if (render_card) {
                  void perform_submission(render_card.id, selected_level);
                }
              }}
              disabled={is_submitting || !render_card}
              className="rounded-[999px] border border-emerald-300/60 bg-emerald-400/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(16,185,129,0.45)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Log memory level
            </button>
            <SubmissionHint status={submission_status} message={feedback_message} />
          </div>
        </div>
      ) : (
        <article className="rounded-[32px] border border-dashed border-white/20 bg-white/5 p-6 text-white">
          <h2 className="text-xl font-semibold">Ready to review</h2>
          <p className="mt-2 text-sm text-white/70">
            No active round yet. Press &ldquo;Start review&rdquo; above to draw a fresh batch of cards.
          </p>
          <p className="mt-1 text-xs text-white/50">
            Completed words drop out of the session automatically so you can focus on what needs reinforcement.
          </p>
        </article>
      )}
    </section>
  );
}

interface SubmissionHintProps {
  readonly status: 'idle' | 'saving' | 'success' | 'error';
  readonly message: string | null;
}

function SubmissionHint({ status, message }: SubmissionHintProps) {
  if (!message) {
    return (
      <p className="text-xs text-white/60">
        Keyboard shortcuts or swipe gestures also submit the card instantly.
      </p>
    );
  }
  const color_class =
    status === 'success'
      ? 'text-emerald-300'
      : status === 'error'
        ? 'text-red-300'
        : status === 'saving'
          ? 'text-amber-200'
          : 'text-white/60';
  return (
    <p className={`text-xs ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
