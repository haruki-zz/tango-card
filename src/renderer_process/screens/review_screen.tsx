import { useEffect } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { MemoryLevel } from '../../domain/review/memory_level';
import { MemoryLevelBadge } from '../components/memory_level_badge';
import { use_review_cycle } from '../hooks/use_review_cycle';

const MEMORY_CONTROLS: Array<{ label: string; level: MemoryLevel }> = [
  { label: '熟知', level: MemoryLevel.WELL_KNOWN },
  { label: '不太熟', level: MemoryLevel.SOMEWHAT_FAMILIAR },
  { label: '需要强化', level: MemoryLevel.NEEDS_REINFORCEMENT },
];

export function ReviewScreen() {
  const { queue, active_card, load_queue, submit_review } = use_review_cycle();

  useEffect(() => {
    load_queue().catch(() => {
      // 由调用方负责显示错误，这里保持静默以便在 UI 中处理。
    });
  }, [load_queue]);

  if (!active_card) {
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
        <SvgCanvas svg_source={active_card.svg_source} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px' }}>
        <h2>记忆强度</h2>
        <MemoryLevelBadge level={active_card.memory_level} />
        <p>待复习队列：{queue.length} 张</p>
        {MEMORY_CONTROLS.map((control) => (
          <button
            key={control.level}
            onClick={() => submit_review(active_card.id, control.level)}
          >
            标记为「{control.label}」
          </button>
        ))}
      </div>
    </section>
  );
}
