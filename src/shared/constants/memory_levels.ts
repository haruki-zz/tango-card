import { MemoryLevel } from '../../domain/review/memory_level';

export interface MemoryLevelOption {
  readonly level: MemoryLevel;
  readonly label: string;
  readonly description?: string;
  readonly shortcut: string;
  readonly alt_shortcuts?: readonly string[];
}

export const MEMORY_LEVEL_OPTIONS: MemoryLevelOption[] = [
  {
    level: MemoryLevel.WELL_KNOWN,
    label: 'Well Known',
    description: 'Fully mastered; occasional refresh only.',
    shortcut: '1',
    alt_shortcuts: ['ArrowRight', 'l'],
  },
  {
    level: MemoryLevel.SOMEWHAT_FAMILIAR,
    label: 'Somewhat Familiar',
    description: 'Needs periodic review to stay fresh.',
    shortcut: '2',
    alt_shortcuts: ['ArrowUp', 'ArrowDown', 'k'],
  },
  {
    level: MemoryLevel.NEEDS_REINFORCEMENT,
    label: 'Needs Reinforcement',
    description: 'At risk of forgetting; review soon.',
    shortcut: '3',
    alt_shortcuts: ['ArrowLeft', 'j'],
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
