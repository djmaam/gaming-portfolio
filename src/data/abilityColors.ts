// Per-cell color palette for the AbilityStats bar (10 cells, 0-indexed).
// Shared by AbilityStats.astro (SSR fill) and abilityStats.ts (rAF count-up)
// so the two paths can't drift apart.
export const ABILITY_CELL_COLORS = [
  'var(--c-green)',  'var(--c-green)',  'var(--c-green)',  'var(--c-green)',
  'var(--c-green)',  'var(--c-green)',  'var(--c-yellow)', 'var(--c-yellow)',
  'var(--c-red)',    'var(--c-red)',
] as const;
