import { useEffect, useMemo, useCallback, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';

export function ReviewScreen() {
  const { queue, active_card, load_queue, submit_review } = use_review_cycle();

  const render_card = active_card;
  const [selected_level, set_selected_level] = useState<MemoryLevel>(MEMORY_LEVEL_DEFAULT);
  const [submission_status, set_submission_status] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [feedback_message, set_feedback_message] = useState<string | null>(null);
  const [is_submitting, set_is_submitting] = useState(false);

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

  useEffect(() => {
    load_queue().catch(() => {
      // 由调用方负责显示错误，这里保持静默以便在 UI 中处理。
    });
  }, [load_queue]);

  const perform_submission = useCallback(
    async (card_id: string, level: MemoryLevel) => {
      if (is_submitting) {
        return;
      }
      set_is_submitting(true);
      set_submission_status('saving');
      set_feedback_message('提交中...');
      try {
        await submit_review(card_id, level);
        set_submission_status('success');
        set_feedback_message('已记录本次记忆等级。');
      } catch (error) {
        set_submission_status('error');
        set_feedback_message(`提交失败：${(error as Error).message}`);
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

  if (!render_card) {
    return (
      <section>
        <h2>准备复习</h2>
        <p>目前没有待复习的单词卡，请先创建或更新卡片。</p>
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <SvgCanvas svg_source={render_card.svg_source} on_swipe={handle_swipe} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px' }}>
        <h2>记忆强度</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>上次记录</span>
          <MemoryLevelBadge level={render_card.memory_level} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>本次选择</span>
          <MemoryLevelBadge level={selected_level} />
        </div>
        <p>待复习队列：{queue.length} 张</p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          选择记忆等级后点击“记录记忆等级”。仍可使用快捷键 1/2/3、方向键或滑动手势快速提交。
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {MEMORY_LEVEL_OPTIONS.map((option) => (
            <li key={option.level}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="memory-level-choice"
                  value={option.level}
                  checked={selected_level === option.level}
                  disabled={is_submitting}
                  onChange={() => {
                    set_selected_level(option.level);
                    set_submission_status('idle');
                    set_feedback_message(null);
                  }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <strong>{option.label}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    快捷键：{[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' / ')}
                  </span>
                  {option.description ? (
                    <span style={{ fontSize: '0.75rem', color: '#cbd5f5' }}>{option.description}</span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
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
          记录记忆等级
        </button>
        <SubmissionHint status={submission_status} message={feedback_message} />
      </div>
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
        使用快捷键或滑动手势也会立即提交当前卡片。
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
