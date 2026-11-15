import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TARGET,
  DRAG_RADIANS_PER_WIDTH,
  FALLBACK_DISTANCE,
  FIGURE_FIT,
  INERTIA_STOP,
  MAX_DISTANCE_FACTOR,
  MIN_DISTANCE,
  applyDrag,
  clampView,
  defaultDistance,
  distanceFor,
  dragVelocityToYawRate,
  easeInOutCubic,
  isBehind,
  isDefaultView,
  lerpView,
  rotateBy,
  rotateY,
  shortestDelta,
  stepInertia,
  worldTarget,
  wrapAngle,
  zoomBy,
  zoomLimits,
  type View,
} from '../components/figure3d/orbit';

const PI = Math.PI;
const view = (yaw = 0, distance = 4, target = DEFAULT_TARGET): View => ({ yaw, target, distance });

describe('angles', () => {
  it('wraps into (−π, π]', () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(PI)).toBeCloseTo(PI);
    expect(wrapAngle(-PI)).toBeCloseTo(PI);
    expect(wrapAngle(3 * PI)).toBeCloseTo(PI);
    expect(wrapAngle(2 * PI + 0.5)).toBeCloseTo(0.5);
    expect(wrapAngle(-2 * PI - 0.5)).toBeCloseTo(-0.5);
    expect(wrapAngle(Number.NaN)).toBe(0);
  });

  it('takes the shortest way round, also across ±π', () => {
    expect(shortestDelta(0, 1)).toBeCloseTo(1);
    expect(shortestDelta(PI - 0.1, -PI + 0.1)).toBeCloseTo(0.2);
    expect(shortestDelta(-PI + 0.1, PI - 0.1)).toBeCloseTo(-0.2);
    expect(shortestDelta(0, PI)).toBeCloseTo(PI);
  });

  it('eases in and out and clamps its input', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
  });
});

describe('lerpView', () => {
  it('interpolates distance and target linearly', () => {
    const a = view(0, 4, { x: 0, y: 1, z: 0 });
    const b = view(0, 2, { x: 0.2, y: 1.6, z: 0 });
    const mid = lerpView(a, b, 0.5);
    expect(mid.distance).toBeCloseTo(3);
    expect(mid.target).toEqual({ x: 0.1, y: 1.3, z: 0 });
  });

  it('turns by the shortest path across π (kidneys from the back)', () => {
    const a = view(PI - 0.2);
    const b = view(-PI + 0.2);
    const mid = lerpView(a, b, 0.5);
    expect(Math.abs(mid.yaw)).toBeCloseTo(PI);
    expect(lerpView(a, b, 1).yaw).toBeCloseTo(-PI + 0.2);
  });
});

describe('rotation', () => {
  it('rotates like three.js rotation.y: +Z (front) swings to +X for a positive yaw', () => {
    const p = rotateY({ x: 0, y: 1, z: 1 }, PI / 2);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBe(1);
    expect(p.z).toBeCloseTo(0);
  });

  it('keeps the target on the turning figure', () => {
    const v = view(PI, 2, { x: 0.075, y: 1.07, z: -0.06 });
    const w = worldTarget(v);
    expect(w.x).toBeCloseTo(-0.075);
    expect(w.z).toBeCloseTo(0.06);
  });

  it('marks anchors on the far side as behind', () => {
    const kidney = { x: 0.075, y: 1.07, z: -0.06 };
    expect(isBehind(kidney, 0)).toBe(false);
    expect(isBehind(kidney, PI)).toBe(false);
    const femur = { x: -0.12, y: 0.72, z: 0 };
    expect(isBehind(femur, -PI / 2)).toBe(true);
    expect(isBehind(femur, PI / 2)).toBe(false);
  });
});

describe('drag and zoom', () => {
  it('one full stage-width drag turns 270°; right turns the front to the right', () => {
    expect(DRAG_RADIANS_PER_WIDTH).toBeCloseTo(1.5 * PI);
    expect(applyDrag(view(0), 100, 600).yaw).toBeCloseTo(PI / 4);
    expect(applyDrag(view(0), -100, 600).yaw).toBeCloseTo(-PI / 4);
    expect(applyDrag(view(PI - 0.1), 100, 600).yaw).toBeCloseTo(wrapAngle(PI - 0.1 + PI / 4));
  });

  it('ignores a drag on a stage with no width', () => {
    const v = view(0.3);
    expect(applyDrag(v, 50, 0)).toBe(v);
    expect(dragVelocityToYawRate(1, 0)).toBe(0);
  });

  it('converts a drag speed to a yaw rate', () => {
    // 0.6 px/ms on a 600 px stage = one width per second = 270°/s.
    expect(dragVelocityToYawRate(0.6, 600)).toBeCloseTo(1.5 * PI);
  });

  it('rotateBy wraps', () => {
    expect(rotateBy(view(PI - 0.1), 0.2).yaw).toBeCloseTo(-PI + 0.1);
  });

  it('clamps zoom between the minimum and default × 1.15', () => {
    const limits = zoomLimits(4);
    expect(limits.min).toBe(MIN_DISTANCE);
    expect(limits.max).toBeCloseTo(4 * MAX_DISTANCE_FACTOR);
    expect(zoomBy(view(0, 4), 100, limits).distance).toBe(MIN_DISTANCE);
    expect(zoomBy(view(0, 4), 0.01, limits).distance).toBeCloseTo(4.6);
    expect(zoomBy(view(0, 4), 2, limits).distance).toBeCloseTo(2);
  });

  it('ignores nonsense zoom factors', () => {
    const v = view(0, 3);
    expect(zoomBy(v, 0, zoomLimits(4))).toBe(v);
    expect(zoomBy(v, Number.NaN, zoomLimits(4))).toBe(v);
  });

  it('drifts the target home while zooming out, reaching it at the maximum distance', () => {
    const head = { x: 0, y: 1.69, z: 0 };
    const limits = zoomLimits(4);
    const half = zoomBy(view(0, 1, head), 0.5, limits);
    expect(half.distance).toBeCloseTo(2);
    expect(half.target.y).toBeLessThan(1.69);
    expect(half.target.y).toBeGreaterThan(DEFAULT_TARGET.y);
    const out = zoomBy(view(0, 1, head), 0.001, limits);
    expect(out.target).toEqual(DEFAULT_TARGET);
    // Zooming in never moves the target.
    expect(zoomBy(view(0, 2, head), 2, limits).target).toBe(head);
  });

  it('clampView pulls a view back into new limits after a resize', () => {
    const v = view(0, 9);
    expect(clampView(v, zoomLimits(4)).distance).toBeCloseTo(4.6);
    const ok = view(0, 3);
    expect(clampView(ok, zoomLimits(4))).toBe(ok);
  });
});

describe('inertia', () => {
  it('decays exponentially and integrates the travelled angle', () => {
    const step = stepInertia(4, 0.016);
    expect(step.velocity).toBeLessThan(4);
    expect(step.velocity).toBeGreaterThan(3.5);
    expect(step.delta).toBeGreaterThan(0);
    expect(step.delta).toBeLessThan(4 * 0.016);
  });

  it('stops: below the threshold the velocity becomes exactly 0', () => {
    let v = 6;
    let frames = 0;
    while (v !== 0 && frames < 1000) {
      v = stepInertia(v, 1 / 60).velocity;
      frames++;
    }
    expect(v).toBe(0);
    expect(frames).toBeLessThan(200);
    expect(stepInertia(INERTIA_STOP / 2, 0.016)).toEqual({ velocity: 0, delta: 0 });
  });

  it('caps a long frame (background tab) so a fling cannot jump far', () => {
    const long = stepInertia(5, 10);
    const capped = stepInertia(5, 0.1);
    expect(long.delta).toBeCloseTo(capped.delta);
    expect(stepInertia(5, Number.NaN).delta).toBe(0);
  });

  it('works in both directions', () => {
    expect(stepInertia(-3, 0.02).delta).toBeLessThan(0);
  });
});

describe('default view', () => {
  it('fits the whole figure into the figure box (height or width, whichever binds)', () => {
    // A tall narrow box: width binds.
    const narrow = defaultDistance(30, 584, { width: 258, height: 532 });
    expect(narrow).toBeCloseTo(distanceFor(30, 584, FIGURE_FIT.width, 258));
    // A wide box: height binds.
    const wide = defaultDistance(30, 584, { width: 500, height: 532 });
    expect(wide).toBeCloseTo(distanceFor(30, 584, FIGURE_FIT.height, 532));
    expect(narrow).toBeGreaterThan(wide);
  });

  it('projects the figure height onto exactly the fit height', () => {
    const d = defaultDistance(30, 600, { width: 1000, height: 500 });
    const visibleHeight = 2 * d * Math.tan((15 * PI) / 180);
    expect((FIGURE_FIT.height / visibleHeight) * 600).toBeCloseTo(500);
  });

  it('falls back before anything was measured', () => {
    expect(defaultDistance(30, 0, { width: 0, height: 0 })).toBe(FALLBACK_DISTANCE);
  });

  it('recognises the default view with a tolerance', () => {
    const def = view(0, 4);
    expect(isDefaultView(view(2 * PI, 4), def)).toBe(true);
    expect(isDefaultView(view(0.01, 4), def)).toBe(false);
    expect(isDefaultView(view(0, 3.9), def)).toBe(false);
    expect(isDefaultView(view(0, 4, { x: 0, y: 1.2, z: 0 }), def)).toBe(false);
  });
});
