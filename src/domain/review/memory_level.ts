export enum MemoryLevel {
  WELL_KNOWN = 'well_known',
  SOMEWHAT_FAMILIAR = 'somewhat_familiar',
  NEEDS_REINFORCEMENT = 'needs_reinforcement'
}

export const MEMORY_LEVEL_DEFAULT = MemoryLevel.SOMEWHAT_FAMILIAR;

export const MEMORY_LEVEL_WEIGHTS: Record<MemoryLevel, number> = {
  [MemoryLevel.WELL_KNOWN]: 1,
  [MemoryLevel.SOMEWHAT_FAMILIAR]: 3,
  [MemoryLevel.NEEDS_REINFORCEMENT]: 5
};
