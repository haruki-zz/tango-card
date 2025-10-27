import { useEffect, useMemo, useCallback } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';

export function ReviewScreen() {
  const { queue, active_card, load_queue, submit_review } = use_review_cycle();

  const render_card = active_card;

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
    load_queue().catch(() => {
      // 由调用方负责显示错误，这里保持静默以便在 UI 中处理。
    });
  }, [load_queue]);

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
      submit_review(render_card.id, mapping.level);
    };
    window.addEventListener('keydown', handle_keydown);
    return () => {
      window.removeEventListener('keydown', handle_keydown);
    };
  }, [render_card, shortcut_map, submit_review]);

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
      submit_review(render_card.id, target_option.level);
    },
    [render_card, submit_review],
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
        <MemoryLevelBadge level={render_card.memory_level} />
        <p>待复习队列：{queue.length} 张</p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          快捷键：按 1/2/3 或方向键，亦可在预览区向左右/上下滑动快速打分。
        </p>
        {MEMORY_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.level}
            type="button"
            aria-keyshortcuts={[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' ')}
            onClick={() => submit_review(render_card.id, option.level)}
          >
            标记为「{option.label}」
            <span style={{ fontSize: '0.75rem' }}>
              （{[option.shortcut, ...(option.alt_shortcuts ?? [])].join(' / ')}）
            </span>
            {option.description ? (
              <span style={{ display: 'block', fontSize: '0.75rem' }}>{option.description}</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
