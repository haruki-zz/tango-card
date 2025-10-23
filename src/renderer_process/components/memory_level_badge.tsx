import { MemoryLevel } from '../../domain/review/memory_level';
import { get_memory_level_label } from '../../shared/constants/memory_levels';

interface MemoryLevelBadgeProps {
  readonly level: MemoryLevel;
}

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
      {get_memory_level_label(level)}
    </span>
  );
}
