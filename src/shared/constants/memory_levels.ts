import { MemoryLevel } from '../../domain/review/memory_level';

export interface MemoryLevelOption {
  readonly level: MemoryLevel;
  readonly label: string;
  readonly description?: string;
  readonly shortcut: string;
}

export const MEMORY_LEVEL_OPTIONS: MemoryLevelOption[] = [
  {
    level: MemoryLevel.WELL_KNOWN,
    label: '熟知',
    description: '已经完全掌握，仅需偶尔回顾。',
    shortcut: '1',
  },
  {
    level: MemoryLevel.SOMEWHAT_FAMILIAR,
    label: '不太熟',
    description: '需要适度复习来巩固记忆。',
    shortcut: '2',
  },
  {
    level: MemoryLevel.NEEDS_REINFORCEMENT,
    label: '需要强化',
    description: '当前容易遗忘，优先安排复习。',
    shortcut: '3',
  },
];

const MEMORY_LEVEL_LABEL_LOOKUP = MEMORY_LEVEL_OPTIONS.reduce<Record<MemoryLevel, string>>(
  (accumulator, option) => {
    accumulator[option.level] = option.label;
    return accumulator;
  },
  {} as Record<MemoryLevel, string>,
);

export function get_memory_level_label(level: MemoryLevel): string {
  return MEMORY_LEVEL_LABEL_LOOKUP[level] ?? level;
}
