import { useEffect, useMemo, useCallback, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';

export function ReviewScreen() {
  const { queue, active_card, start_round, submit_review } = use_review_cycle();

  const render_card = active_card;
  const [selected_level, set_selected_level] = useState<MemoryLevel>(MEMORY_LEVEL_DEFAULT);
  const [submission_status, set_submission_status] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [feedback_message, set_feedback_message] = useState<string | null>(null);
  const [is_submitting, set_is_submitting] = useState(false);
  const [round_status, set_round_status] = useState<'idle' | 'loading' | 'error'>('idle');
  const [round_error, set_round_error] = useState<string | null>(null);

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
    } catch (error) {
      set_round_status('error');
      set_round_error((error as Error).message);
    }
  }, [start_round]);

  const round_in_progress = queue.length > 0 && Boolean(render_card);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            void handle_start_round();
          }}
          disabled={round_status === 'loading'}
          style={{
            padding: '0.6rem 1.6rem',
            borderRadius: '9999px',
            border: '1px solid #1d4ed8',
            backgroundColor: round_status === 'loading' ? '#1e293b' : '#1d4ed8',
            color: '#f8fafc',
            cursor: round_status === 'loading' ? 'progress' : 'pointer',
            fontWeight: 600,
          }}
        >
          {round_status === 'loading' ? 'Preparing...' : 'Start Review'}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Each round draws up to 30 cards with a 1:3:6 memory-level ratio (Well Known / Somewhat Familiar /
            Needs Reinforcement).
          </span>
          {round_error ? (
            <span style={{ fontSize: '0.85rem', color: '#f87171' }}>Failed to start review: {round_error}</span>
          ) : null}
        </div>
      </header>

      {round_in_progress && render_card ? (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <SvgCanvas svg_source={render_card.svg_source} on_swipe={handle_swipe} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px' }}>
            <h2>Memory Strength</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Last recorded</span>
              <MemoryLevelBadge level={render_card.memory_level} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current selection</span>
              <MemoryLevelBadge level={selected_level} />
            </div>
            <p>Cards remaining in this round: {queue.length}</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Choose a memory level and select &ldquo;Log Memory Level.&rdquo; Shortcuts 1/2/3, arrow keys, or swipe
              gestures submit instantly.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>Memory Level</span>
              <select
                value={selected_level}
                disabled={is_submitting}
                onChange={(event) => {
                  set_selected_level(event.target.value as MemoryLevel);
                  set_submission_status('idle');
                  set_feedback_message(null);
                }}
                style={{ padding: '0.5rem' }}
              >
                {MEMORY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.level} value={option.level}>
                    {option.label} (Shortcut: {[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' / ')})
                  </option>
                ))}
              </select>
              {selected_option?.description ? (
                <span style={{ fontSize: '0.75rem', color: '#cbd5f5' }}>{selected_option.description}</span>
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
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                border: '1px solid #22c55e',
                backgroundColor: is_submitting ? '#1e293b' : '#22c55e',
                color: '#0f172a',
                cursor: is_submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Log Memory Level
            </button>
            <SubmissionHint status={submission_status} message={feedback_message} />
          </div>
        </div>
      ) : (
        <article style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2>Ready to Review</h2>
          <p>No active round yet. Press &ldquo;Start Review&rdquo; to draw a new set of words.</p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            You can begin another round whenever you like; completed cards are removed from the current session.
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
      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
        Keyboard shortcuts or swipe gestures also submit the card instantly.
      </p>
    );
  }
  const color =
    status === 'success' ? '#16a34a' : status === 'error' ? '#ef4444' : status === 'saving' ? '#facc15' : '#94a3b8';
  return (
    <p style={{ fontSize: '0.8rem', color }} aria-live="polite">
      {message}
    </p>
  );
}
