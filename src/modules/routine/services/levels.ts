/** XP needed per level (linear for now; Engineer 1 may tune in P1). */
export const XP_PER_LEVEL = 100;

/** Level from total XP. Level 1 at 0 XP. Pure. */
export const levelForXp = (xp: number): number => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

/** Progress 0–1 inside the current level. */
export const levelProgress = (xp: number): number =>
  (Math.max(0, xp) % XP_PER_LEVEL) / XP_PER_LEVEL;
