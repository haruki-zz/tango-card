import { MemoryLevel } from '../../domain/review/memory_level';

interface MemoryLevelBadgeProps {
  readonly level: MemoryLevel;
}

const MEMORY_LEVEL_LABELS: Record<MemoryLevel, string> = {
  [MemoryLevel.WELL_KNOWN]: '熟知',
  [MemoryLevel.SOMEWHAT_FAMILIAR]: '不太熟',
  [MemoryLevel.NEEDS_REINFORCEMENT]: '需要强化',
};

export function MemoryLevelBadge({ level }: MemoryLevelBadgeProps) {
  return (
    <span
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        backgroundColor: '#334155',
        color: '#f8fafc',
        fontSize: '0.75rem',
      }}
    >
      {MEMORY_LEVEL_LABELS[level]}
    </span>
  );
}
