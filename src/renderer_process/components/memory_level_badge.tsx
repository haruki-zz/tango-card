import { MemoryLevel } from '../../domain/review/memory_level';
import { get_memory_level_label } from '../../shared/constants/memory_levels';

interface MemoryLevelBadgeProps {
  readonly level: MemoryLevel;
}

const BADGE_STYLES: Record<MemoryLevel, string> = {
  [MemoryLevel.WELL_KNOWN]: 'border border-[#bbf7d0] text-[#166534]',
  [MemoryLevel.SOMEWHAT_FAMILIAR]: 'border border-[#bae6fd] text-[#0c4a6e]',
  [MemoryLevel.NEEDS_REINFORCEMENT]: 'border border-[#fecdd3] text-[#9f1239]',
};

export function MemoryLevelBadge({ level }: MemoryLevelBadgeProps) {
  const variant_class =
    BADGE_STYLES[level] ?? 'border border-white/20 bg-white/10 text-white/80 shadow-[0_0_8px_rgba(255,255,255,0.2)]';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variant_class}`}>
      {get_memory_level_label(level)}
    </span>
  );
}
