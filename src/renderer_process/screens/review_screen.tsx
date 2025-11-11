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
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-6 py-8 text-[#111827]">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              void handle_start_round();
            }}
            disabled={round_status === 'loading'}
            className="rounded-full border border-[#111827] bg-white px-5 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#111827] hover:text-white"
          >
            {round_status === 'loading' ? 'Preparing…' : 'Start review'}
          </button>
          <div className="text-sm text-[#4b5563]">
            <p>Each round pulls a handful of cards, weighted toward the ones you forget most.</p>
            {round_error ? <p className="text-xs text-red-600">Failed to start: {round_error}</p> : null}
          </div>
        </div>
      </div>

      {round_in_progress && render_card ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-sm">
            <SvgCanvas svg_source={render_card.svg_source} on_swipe={handle_swipe} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-sm">
            <h2 className="text-base font-semibold">Log memory level</h2>
            <div className="text-sm text-[#4b5563]">
              <p className="mb-1 text-xs uppercase tracking-[0.15em] text-[#6b7280]">Last recorded</p>
              <MemoryLevelBadge level={render_card.memory_level} />
            </div>
            <div className="text-sm text-[#4b5563]">
              <p className="mb-1 text-xs uppercase tracking-[0.15em] text-[#6b7280]">Current selection</p>
              <MemoryLevelBadge level={selected_level} />
            </div>
            <p className="text-sm text-[#4b5563]">Cards remaining: {queue.length}</p>
            <label className="flex flex-col gap-1 text-sm text-[#374151]">
              Memory level
              <select
                value={selected_level}
                disabled={is_submitting}
                onChange={(event) => {
                  set_selected_level(event.target.value as MemoryLevel);
                  set_submission_status('idle');
                  set_feedback_message(null);
                }}
                className="rounded-lg border border-[#d1d5db] bg-white px-3 py-2 focus:border-[#111827] focus:outline-none disabled:opacity-60"
              >
                {MEMORY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.level} value={option.level}>
                    {option.label} (Shortcut: {[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' / ')})
                  </option>
                ))}
              </select>
              {selected_option?.description ? (
                <span className="text-xs text-[#6b7280]">{selected_option.description}</span>
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
              className="rounded-full bg-[#111827] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Log memory level
            </button>
            <SubmissionHint status={submission_status} message={feedback_message} />
            <p className="text-xs text-[#6b7280]">
              Shortcuts 1/2/3 or arrow keys submit instantly. Swiping the card also works.
            </p>
          </div>
        </div>
      ) : (
        <article className="rounded-2xl border border-dashed border-[#d1d5db] bg-white px-6 py-5 text-sm text-[#4b5563] shadow-sm">
          <p>No active round yet. Press “Start review” to draw a fresh batch of cards.</p>
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
      <p className="text-xs text-[#6b7280]">
        Keyboard shortcuts or swipe gestures also submit the card instantly.
      </p>
    );
  }
  const color_class =
    status === 'success'
      ? 'text-green-600'
      : status === 'error'
        ? 'text-red-600'
        : status === 'saving'
          ? 'text-yellow-600'
          : 'text-[#6b7280]';
  return (
    <p className={`text-xs ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
