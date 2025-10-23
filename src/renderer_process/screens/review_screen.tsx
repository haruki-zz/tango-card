import { useEffect } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';

export function ReviewScreen() {
  const { queue, active_card, load_queue, submit_review } = use_review_cycle();

  const render_card = active_card;

  useEffect(() => {
    load_queue().catch(() => {
      // 由调用方负责显示错误，这里保持静默以便在 UI 中处理。
    });
  }, [load_queue]);

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
        <SvgCanvas svg_source={render_card.svg_source} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px' }}>
        <h2>记忆强度</h2>
        <MemoryLevelBadge level={render_card.memory_level} />
        <p>待复习队列：{queue.length} 张</p>
        {MEMORY_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.level}
            type="button"
            onClick={() => submit_review(render_card.id, option.level)}
          >
            标记为「{option.label}」
            {option.description ? (
              <span style={{ display: 'block', fontSize: '0.75rem' }}>{option.description}</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
