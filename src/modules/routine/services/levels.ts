/**
 * XP needed per level (ADR-050). 700 ≈ one flawless ISS week: ~10 measurement tasks a day × 10 XP
 * × 7 days (one rest day without exercise, plus the weekly glucose check). Linear on purpose.
 */
export const XP_PER_LEVEL = 700;

/** Level from total XP. Level 1 at 0 XP. Pure. */
export const levelForXp = (xp: number): number => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

/** Progress 0–1 inside the current level. */
export const levelProgress = (xp: number): number =>
  (Math.max(0, xp) % XP_PER_LEVEL) / XP_PER_LEVEL;
