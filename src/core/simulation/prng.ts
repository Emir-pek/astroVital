/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic: same seed ⇒ same sequence ⇒ the jury demo is identical every run.
 * NOT cryptographically secure — simulation only.
 */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface Rng {
  /** Uniform [0, 1). */
  next(): number;
  /** Uniform [min, max). */
  uniform(min: number, max: number): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Gaussian via Box–Muller. */
  normal(mean?: number, sd?: number): number;
  /** true with probability p. */
  chance(p: number): boolean;
}

export const createRng = (seed: number): Rng => {
  const next = mulberry32(seed);
  return {
    next,
    uniform: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    normal: (mean = 0, sd = 1) => {
      // Avoid log(0).
      const u = Math.max(next(), Number.EPSILON);
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance: (p) => next() < p,
  };
};
