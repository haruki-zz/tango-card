import { MemoryLevel } from '../../domain/review/memory_level';
import { get_memory_level_label } from '../../shared/constants/memory_levels';

interface MemoryLevelBadgeProps {
  readonly level: MemoryLevel;
}

const BADGE_STYLES: Record<MemoryLevel, string> = {
  [MemoryLevel.WELL_KNOWN]:
    'border border-emerald-300/40 bg-emerald-400/10 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  [MemoryLevel.SOMEWHAT_FAMILIAR]:
    'border border-sky-300/40 bg-sky-400/10 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
  [MemoryLevel.NEEDS_REINFORCEMENT]:
    'border border-rose-300/40 bg-rose-400/10 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
};

export function MemoryLevelBadge({ level }: MemoryLevelBadgeProps) {
  const variant_class =
    BADGE_STYLES[level] ?? 'border border-white/20 bg-white/10 text-white/80 shadow-[0_0_8px_rgba(255,255,255,0.2)]';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] ${variant_class}`}
    >
      {get_memory_level_label(level)}
    </span>
  );
}
