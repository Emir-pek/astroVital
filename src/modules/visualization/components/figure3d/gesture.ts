/*
 * Pure pointer bookkeeping of the 3D stage (spec 2026-11-15 §3.1, tablet first):
 *
 *   tap   = one pointer, total movement < TAP_SLOP CSS px, no second finger at any time.
 *           No time limit: a gloved finger is slow.
 *   drag  = one pointer that moved ≥ TAP_SLOP → turns the figure; release → inertia.
 *   pinch = two pointers → zoom by the ratio of their distances. A pinch never ends in a tap, and
 *           the finger left on the glass after a pinch carries on from where it is (no jump).
 *
 * Every function returns a new state plus at most one effect for the stage to apply.
 */

/** Movement (CSS px) below which a press still counts as a tap. */
export const TAP_SLOP = 10;
/** Window of recent drag samples used for the release speed (ms). */
export const VELOCITY_WINDOW_MS = 80;

export interface Point {
  x: number;
  y: number;
}

interface Sample {
  x: number;
  t: number;
}

export interface GestureState {
  /** Tracked pointers (at most two), keyed by pointerId. */
  pointers: Readonly<Record<number, Point>>;
  /** Where the current single-finger movement is measured from. */
  origin: Point | null;
  /** The finger has moved beyond the tap slop: it is dragging. */
  dragging: boolean;
  /** A second finger took part in this gesture (until every finger is up). */
  pinched: boolean;
  /** Distance between the two fingers at the last move (px). */
  pinchDistance: number;
  /** Recent drag samples (x, time) for the release speed. */
  samples: readonly Sample[];
}

export type GestureEffect =
  | { type: 'rotate'; dx: number }
  | { type: 'zoom'; factor: number }
  | { type: 'dragStart' }
  | { type: 'tap'; x: number; y: number }
  | { type: 'release'; velocity: number };

export interface GestureResult {
  state: GestureState;
  effect: GestureEffect | null;
}

export const IDLE: GestureState = {
  pointers: {},
  origin: null,
  dragging: false,
  pinched: false,
  pinchDistance: 0,
  samples: [],
};

const ids = (s: GestureState): number[] => Object.keys(s.pointers).map(Number);

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

function pinchSpan(pointers: Readonly<Record<number, Point>>): number {
  const [a, b] = Object.values(pointers);
  return a && b ? distance(a, b) : 0;
}

const recent = (samples: readonly Sample[], now: number): Sample[] =>
  samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);

/** Horizontal release speed (px/ms) from the samples of the last VELOCITY_WINDOW_MS. */
export function releaseVelocity(samples: readonly Sample[], now: number): number {
  const window = recent(samples, now);
  if (window.length < 2) return 0;
  const first = window[0]!;
  const last = window[window.length - 1]!;
  const dt = last.t - first.t;
  return dt >= 1 ? (last.x - first.x) / dt : 0;
}

export function pointerDown(s: GestureState, id: number, p: Point, t: number): GestureResult {
  const tracked = ids(s);
  if (tracked.includes(id) || tracked.length >= 2) return { state: s, effect: null };
  const pointers = { ...s.pointers, [id]: p };
  if (tracked.length === 0) {
    return {
      state: { ...IDLE, pointers, origin: p, samples: [{ x: p.x, t }] },
      effect: null,
    };
  }
  // Second finger: from now on this gesture is a pinch and can no longer be a tap.
  return {
    state: {
      ...s,
      pointers,
      pinched: true,
      dragging: false,
      origin: null,
      samples: [],
      pinchDistance: pinchSpan(pointers),
    },
    effect: null,
  };
}

export function pointerMove(s: GestureState, id: number, p: Point, t: number): GestureResult {
  const prev = s.pointers[id];
  if (!prev) return { state: s, effect: null };
  const pointers = { ...s.pointers, [id]: p };
  const count = ids(s).length;

  if (count === 2) {
    const span = pinchSpan(pointers);
    const factor = s.pinchDistance > 0 && span > 0 ? span / s.pinchDistance : 1;
    return {
      state: { ...s, pointers, pinchDistance: span },
      effect: factor !== 1 ? { type: 'zoom', factor } : null,
    };
  }

  const origin = s.origin ?? prev;
  if (!s.dragging) {
    if (distance(origin, p) < TAP_SLOP) {
      return { state: { ...s, pointers, origin }, effect: null };
    }
    // Crossing the slop starts the drag here: the slop itself is not turned (no jump).
    return {
      state: { ...s, pointers, origin, dragging: true, samples: [{ x: p.x, t }] },
      effect: { type: 'dragStart' },
    };
  }
  return {
    state: { ...s, pointers, samples: [...recent(s.samples, t), { x: p.x, t }] },
    effect: { type: 'rotate', dx: p.x - prev.x },
  };
}

export function pointerUp(s: GestureState, id: number, p: Point, t: number): GestureResult {
  if (!s.pointers[id]) return { state: s, effect: null };
  const pointers = { ...s.pointers };
  delete pointers[id];
  const left = Object.values(pointers);

  if (left.length === 1) {
    // End of a pinch with one finger still down: it may drag on, measured from where it is now.
    return {
      state: { ...s, pointers, origin: left[0]!, dragging: false, pinchDistance: 0, samples: [] },
      effect: null,
    };
  }

  const origin = s.origin;
  if (!s.pinched && !s.dragging && origin && distance(origin, p) < TAP_SLOP) {
    return { state: IDLE, effect: { type: 'tap', x: p.x, y: p.y } };
  }
  if (s.dragging) {
    const velocity = releaseVelocity([...s.samples, { x: p.x, t }], t);
    return { state: IDLE, effect: { type: 'release', velocity } };
  }
  return { state: IDLE, effect: null };
}

/** The system took the pointer away (scroll, palm rejection…): never a tap, never inertia. */
export function pointerCancel(s: GestureState, id: number): GestureResult {
  if (!s.pointers[id]) return { state: s, effect: null };
  const pointers = { ...s.pointers };
  delete pointers[id];
  const left = Object.values(pointers);
  if (left.length === 0) return { state: IDLE, effect: null };
  return {
    state: {
      ...s,
      pointers,
      origin: left[0]!,
      dragging: false,
      pinched: true,
      pinchDistance: 0,
      samples: [],
    },
    effect: null,
  };
}
