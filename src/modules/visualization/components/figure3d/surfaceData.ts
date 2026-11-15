/*
 * Procedural surface detail for the 3D suit (pure, no three.js): tileable height fields turned
 * into RGBA texel data — RGB = tangent-space normal, A = a scalar detail channel (thread height,
 * streak or blotch value) used for roughness / cavity variation. Deterministic: a fixed seed gives
 * the same bytes every time, so the figure looks identical on every load and in tests.
 */

export type SurfaceKind = 'weave' | 'grain' | 'brushed' | 'macro';

export interface SurfaceData {
  /** Width = height in texels (a power of two, so the texture tiles and mipmaps cleanly). */
  size: number;
  /** size × size × 4 bytes, rows from y = 0. */
  data: Uint8Array;
}

/** Texture edge per kind: small enough to stay cheap (≤ 256² × 4 B ≈ 256 KB each). */
export const SURFACE_SIZE: Record<SurfaceKind, number> = {
  weave: 256,
  grain: 128,
  brushed: 256,
  macro: 128,
};

const SURFACE_SEED: Record<SurfaceKind, number> = {
  weave: 0x5eed01,
  grain: 0x5eed02,
  brushed: 0x5eed03,
  macro: 0x5eed04,
};

/** mulberry32: tiny seeded PRNG, uniform in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number): number => t * t * (3 - 2 * t);
const wrap = (i: number, n: number): number => ((i % n) + n) % n;

/**
 * Tileable value noise over a size × size grid with `px` × `py` lattice cells (each must divide
 * `size` for a seamless wrap). Values in [0, 1].
 */
export function periodicNoise(
  size: number,
  px: number,
  py: number,
  rng: () => number,
): Float32Array {
  const lattice = new Float32Array(px * py);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng();
  const at = (x: number, y: number): number => lattice[wrap(y, py) * px + wrap(x, px)] ?? 0;
  const out = new Float32Array(size * size);
  const cx = size / px;
  const cy = size / py;
  for (let y = 0; y < size; y++) {
    const gy = y / cy;
    const y0 = Math.floor(gy);
    const fy = smooth(gy - y0);
    for (let x = 0; x < size; x++) {
      const gx = x / cx;
      const x0 = Math.floor(gx);
      const fx = smooth(gx - x0);
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
      out[y * size + x] = top + (bottom - top) * fy;
    }
  }
  return out;
}

/** Sum of octaves of periodic noise, normalised to [0, 1]. */
function fbm(
  size: number,
  basePeriod: number,
  octaves: number,
  rng: () => number,
  aspect = 1,
): Float32Array {
  const out = new Float32Array(size * size);
  let amplitude = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const p = Math.min(size, basePeriod * 2 ** o);
    const layer = periodicNoise(size, Math.min(size, p * aspect), p, rng);
    for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) + (layer[i] ?? 0) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) / total;
  return out;
}

/**
 * Ripstop plain weave: over/under warp and weft threads (4 texels each, 64 per tile) with a
 * thicker reinforcing thread every 8 — the woven outer layer of an EVA suit. Height in [0, 1].
 */
function weaveHeight(
  size: number,
  rng: () => number,
): { height: Float32Array; detail: Float32Array } {
  const thread = 4;
  const threads = size / thread;
  const ripstop = 8;
  // Slight per-thread variation in tension and tone, so the cloth is not a perfect grid.
  const warpTone = Array.from({ length: threads }, () => 0.85 + 0.3 * rng());
  const weftTone = Array.from({ length: threads }, () => 0.85 + 0.3 * rng());
  const fibre = periodicNoise(size, size / 2, size / 8, rng);
  const height = new Float32Array(size * size);
  const detail = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const j = Math.floor(y / thread);
    const fy = ((y % thread) + 0.5) / thread;
    for (let x = 0; x < size; x++) {
      const i = Math.floor(x / thread);
      const fx = ((x % thread) + 0.5) / thread;
      const warpUp = (i + j) % 2 === 0;
      const ripWarp = i % ripstop === 0 ? 0.35 : 0;
      const ripWeft = j % ripstop === 0 ? 0.35 : 0;
      // Round thread cross-section, rising over the crossing it lies on top of.
      const warp =
        Math.sin(Math.PI * fx) ** 0.7 * (0.55 + 0.45 * (warpUp ? 1 : -1) * Math.sin(Math.PI * fy)) +
        ripWarp;
      const weft =
        Math.sin(Math.PI * fy) ** 0.7 * (0.55 + 0.45 * (warpUp ? -1 : 1) * Math.sin(Math.PI * fx)) +
        ripWeft;
      const onWarp = warp >= weft;
      const h = Math.max(warp, weft) + 0.06 * ((fibre[y * size + x] ?? 0) - 0.5);
      height[y * size + x] = h / 1.35;
      const tone = onWarp ? (warpTone[i] ?? 1) : (weftTone[j] ?? 1);
      detail[y * size + x] = Math.min(1, Math.max(0, (h / 1.35) * tone));
    }
  }
  return { height, detail };
}

/** Packs a height field into normal (RGB) + detail (A) bytes; `strength` scales the slopes. */
export function heightToRgba(
  height: Float32Array,
  detail: Float32Array,
  size: number,
  strength: number,
): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) => height[wrap(y, size) * size + wrap(x, size)] ?? 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      data[o] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[o + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[o + 3] = Math.round(Math.min(1, Math.max(0, detail[y * size + x] ?? 0)) * 255);
    }
  }
  return data;
}

/** One surface's texel data; same kind + seed → identical bytes. */
export function generateSurface(
  kind: SurfaceKind,
  size: number = SURFACE_SIZE[kind],
  seed: number = SURFACE_SEED[kind],
): SurfaceData {
  const rng = createRng(seed);
  switch (kind) {
    case 'weave': {
      const { height, detail } = weaveHeight(size, rng);
      return { size, data: heightToRgba(height, detail, size, 4) };
    }
    case 'grain': {
      // Moulded rubber / glove palm: fine pebbled grain over a faint softer undulation.
      const fine = fbm(size, size / 4, 2, rng);
      const soft = fbm(size, 4, 2, rng);
      const height = fine.map((v, i) => v * 0.8 + (soft[i] ?? 0) * 0.2);
      return { size, data: heightToRgba(height, fine, size, 5) };
    }
    case 'brushed': {
      // Machined metal: long fine streaks along X (stretched noise), a few deeper scratches.
      const streaks = fbm(size, size / 4, 2, rng, 1 / 32);
      const scratches = periodicNoise(size, 2, size, rng);
      const height = streaks.map((v, i) => v + 0.3 * Math.max(0, (scratches[i] ?? 0) - 0.8));
      return { size, data: heightToRgba(height, streaks, size, 2.5) };
    }
    case 'macro': {
      // Soft large-scale undulation: shallow folds running along X (around a limb, whose axis is
      // its local Y) over a little isotropic puckering, + an independent blotch channel for
      // roughness and tone (smudges).
      const folds = fbm(size, 4, 2, rng, 1 / 4);
      const pucker = fbm(size, 8, 2, rng);
      const height = folds.map((v, i) => v * 0.85 + (pucker[i] ?? 0) * 0.15);
      const blotch = fbm(size, 4, 3, rng);
      return { size, data: heightToRgba(height, blotch, size, 7) };
    }
  }
}
