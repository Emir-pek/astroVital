/*
 * Pure view maths of the 3D body map (spec 2026-11-15 §3.1). No three.js here, so it is cheap to
 * test and safe to import anywhere.
 *
 * The FIGURE turns (group.rotation.y = yaw); the camera and the lights stay on +Z and look at the
 * turned target, so whatever side of the astronaut faces the viewer is the lit side.
 * Figure space: metres, y up, soles at y = 0, the astronaut faces +Z.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface View {
  /** Figure rotation about Y (radians, three's rotation.y convention), kept in (−π, π]. */
  yaw: number;
  /** Point of the figure (figure space) the camera looks at. */
  target: Vec3;
  /** Camera distance from the target (m). */
  distance: number;
}

export interface Size {
  width: number;
  height: number;
}

export const TAU = Math.PI * 2;

/** One drag across the full stage width turns the figure this far (≈ 270°). */
export const DRAG_RADIANS_PER_WIDTH = Math.PI * 1.5;
/** Closest the camera may come to its target (m). */
export const MIN_DISTANCE = 0.45;
/** How far beyond the default (whole figure) distance a user may zoom out. */
export const MAX_DISTANCE_FACTOR = 1.15;
/** Inertia: time constant of the exponential decay (s) and the speed below which it stops (rad/s). */
export const INERTIA_TAU = 0.32;
export const INERTIA_STOP = 0.06;
/** Longest frame step inertia integrates at once (s): a background tab must not fling the figure. */
export const MAX_INERTIA_DT = 0.1;

/** Size of the figure that must fit inside the figure box (m), incl. a little air. */
export const FIGURE_FIT = { height: 1.95, width: 0.98 } as const;
/** Default camera target: halfway up the figure. */
export const DEFAULT_TARGET: Vec3 = { x: 0, y: 0.93, z: 0 };

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Angle wrapped into (−π, π]. */
export function wrapAngle(a: number): number {
  if (!Number.isFinite(a)) return 0;
  const r = ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return r === -Math.PI ? Math.PI : r;
}

/** Signed smallest turn from `from` to `to` (radians, in (−π, π]). */
export function shortestDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** Cubic ease-in-out on [0, 1] (input clamped). */
export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** View between `a` and `b`; the yaw takes the shortest way round. */
export function lerpView(a: View, b: View, t: number): View {
  return {
    yaw: wrapAngle(a.yaw + shortestDelta(a.yaw, b.yaw) * t),
    target: lerpVec(a.target, b.target, t),
    distance: a.distance + (b.distance - a.distance) * t,
  };
}

/** A figure-space point turned by `yaw` about Y — exactly what three's rotation.y does. */
export function rotateY(p: Vec3, yaw: number): Vec3 {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: c * p.x + s * p.z, y: p.y, z: -s * p.x + c * p.z };
}

/** World position of the view's target (the figure turns, the world does not). */
export function worldTarget(view: View): Vec3 {
  return rotateY(view.target, view.yaw);
}

/**
 * True when a figure-space anchor sits on the far side of the turned figure (its world z is more
 * than `threshold` m behind the figure's vertical axis), so its leader line is drawn dimmed.
 */
export function isBehind(anchor: Vec3, yaw: number, threshold = 0.08): boolean {
  return rotateY(anchor, yaw).z < -threshold;
}

/** Drag of `dxPx` CSS px across a stage `widthPx` wide: dragging right turns the front to the right. */
export function applyDrag(view: View, dxPx: number, widthPx: number): View {
  if (!(widthPx > 0) || !Number.isFinite(dxPx)) return view;
  return rotateBy(view, (dxPx / widthPx) * DRAG_RADIANS_PER_WIDTH);
}

/** Drag speed (CSS px per ms) → yaw rate (rad/s) for the same stage width. */
export function dragVelocityToYawRate(pxPerMs: number, widthPx: number): number {
  if (!(widthPx > 0) || !Number.isFinite(pxPerMs)) return 0;
  return ((pxPerMs * 1000) / widthPx) * DRAG_RADIANS_PER_WIDTH;
}

export function rotateBy(view: View, deltaYaw: number): View {
  return { ...view, yaw: wrapAngle(view.yaw + deltaYaw) };
}

export interface ZoomLimits {
  min: number;
  max: number;
  /** Target the camera drifts back to while zooming out; reached exactly at `max`. */
  home: Vec3;
}

/** Zoom limits for a given default (whole figure) distance. */
export function zoomLimits(defaultDist: number): ZoomLimits {
  return {
    min: Math.min(MIN_DISTANCE, defaultDist),
    max: Math.max(MIN_DISTANCE, defaultDist * MAX_DISTANCE_FACTOR),
    home: DEFAULT_TARGET,
  };
}

/**
 * Zoom by `factor` (> 1 = closer). The distance is clamped to the limits; zooming out also slides
 * the target back towards `home`, so a figure zoomed in on the helmet re-centres as it shrinks.
 */
export function zoomBy(view: View, factor: number, limits: ZoomLimits): View {
  if (!(factor > 0) || !Number.isFinite(factor)) return view;
  const current = clamp(view.distance, limits.min, limits.max);
  const distance = clamp(current / factor, limits.min, limits.max);
  let target = view.target;
  if (distance > current && limits.max > current) {
    const t = (distance - current) / (limits.max - current);
    target = lerpVec(view.target, limits.home, clamp(t, 0, 1));
  }
  return { ...view, distance, target };
}

/** The same view with its distance pulled back into the limits (e.g. after a resize). */
export function clampView(view: View, limits: ZoomLimits): View {
  const distance = clamp(view.distance, limits.min, limits.max);
  return distance === view.distance ? view : { ...view, distance };
}

export interface InertiaStep {
  /** Yaw rate after the step (rad/s); exactly 0 once it fell below the stop threshold. */
  velocity: number;
  /** Yaw travelled during the step (rad). */
  delta: number;
}

/** One step of exponentially decaying spin: v(t) = v₀·e^(−t/τ), integrated exactly over dt. */
export function stepInertia(velocity: number, dtSeconds: number): InertiaStep {
  if (!Number.isFinite(velocity) || Math.abs(velocity) < INERTIA_STOP) {
    return { velocity: 0, delta: 0 };
  }
  const dt = clamp(Number.isFinite(dtSeconds) ? dtSeconds : 0, 0, MAX_INERTIA_DT);
  const decay = Math.exp(-dt / INERTIA_TAU);
  const delta = velocity * INERTIA_TAU * (1 - decay);
  const next = velocity * decay;
  return { velocity: Math.abs(next) < INERTIA_STOP ? 0 : next, delta };
}

export function isDefaultView(view: View, def: View, eps = 1e-3): boolean {
  return (
    Math.abs(shortestDelta(view.yaw, def.yaw)) < eps &&
    Math.abs(view.distance - def.distance) < eps &&
    Math.abs(view.target.x - def.target.x) < eps &&
    Math.abs(view.target.y - def.target.y) < eps &&
    Math.abs(view.target.z - def.target.z) < eps
  );
}

/**
 * Camera distance at which `span` metres of figure fill `fitPx` CSS px of a canvas `canvasHeight`
 * px tall, with a vertical field of view of `fovDeg`.
 */
export function distanceFor(fovDeg: number, canvasHeight: number, span: number, fitPx: number) {
  const tanHalf = Math.tan((fovDeg * Math.PI) / 180 / 2);
  if (!(canvasHeight > 0) || !(fitPx > 0) || !(span > 0) || !(tanHalf > 0)) return 0;
  const pxPerMetre = fitPx / span;
  return canvasHeight / (2 * tanHalf * pxPerMetre);
}

/** Fallback camera distance when nothing has been measured yet (m). */
export const FALLBACK_DISTANCE = 4.2;

/**
 * Distance at which the whole figure fits inside `fit` (the figure box, CSS px) of a canvas
 * `canvasHeight` px tall. Width counts too, so a narrow box never clips the arms.
 */
export function defaultDistance(fovDeg: number, canvasHeight: number, fit: Size): number {
  const byHeight = distanceFor(fovDeg, canvasHeight, FIGURE_FIT.height, fit.height);
  const byWidth = distanceFor(fovDeg, canvasHeight, FIGURE_FIT.width, fit.width);
  const d = Math.max(byHeight, byWidth);
  return d > 0 ? d : FALLBACK_DISTANCE;
}
