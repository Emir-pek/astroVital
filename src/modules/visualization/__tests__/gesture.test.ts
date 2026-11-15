import { describe, expect, it } from 'vitest';
import {
  IDLE,
  TAP_SLOP,
  pointerCancel,
  pointerDown,
  pointerMove,
  pointerUp,
  releaseVelocity,
  type GestureEffect,
  type GestureState,
} from '../components/figure3d/gesture';

type Step =
  | ['down' | 'move' | 'up', number, number, number, number] // kind, id, x, y, t
  | ['cancel', number];

/** Runs a sequence of pointer events and collects the effects. */
function run(steps: Step[]): { state: GestureState; effects: GestureEffect[] } {
  let state = IDLE;
  const effects: GestureEffect[] = [];
  for (const step of steps) {
    const result =
      step[0] === 'cancel'
        ? pointerCancel(state, step[1])
        : { down: pointerDown, move: pointerMove, up: pointerUp }[step[0]](
            state,
            step[1],
            { x: step[2], y: step[3] },
            step[4],
          );
    state = result.state;
    if (result.effect) effects.push(result.effect);
  }
  return { state, effects };
}

describe('gesture: tap', () => {
  it('a press with < 10 px movement is a tap, however long it takes (gloves)', () => {
    const { effects, state } = run([
      ['down', 1, 100, 100, 0],
      ['move', 1, 105, 104, 900],
      ['up', 1, 106, 104, 3000],
    ]);
    expect(effects).toEqual([{ type: 'tap', x: 106, y: 104 }]);
    expect(state).toEqual(IDLE);
  });

  it('a press that moved ≥ 10 px is a drag, not a tap — even if it comes back', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['move', 1, 100 + TAP_SLOP, 100, 20],
      ['move', 1, 100, 100, 40],
      ['up', 1, 100, 100, 60],
    ]);
    expect(effects.some((e) => e.type === 'tap')).toBe(false);
    expect(effects[0]).toEqual({ type: 'dragStart' });
  });

  it('a pinch never ends in a tap, also when the fingers barely moved', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['down', 2, 200, 100, 10],
      ['up', 2, 200, 100, 50],
      ['up', 1, 100, 100, 60],
    ]);
    expect(effects).toEqual([]);
  });

  it('a cancelled pointer is never a tap', () => {
    const { effects, state } = run([
      ['down', 1, 100, 100, 0],
      ['cancel', 1],
    ]);
    expect(effects).toEqual([]);
    expect(state).toEqual(IDLE);
  });

  it('ignores events of pointers it does not track', () => {
    const { effects } = run([
      ['move', 7, 0, 0, 0],
      ['up', 7, 0, 0, 0],
    ]);
    expect(effects).toEqual([]);
  });
});

describe('gesture: drag', () => {
  it('rotates by the movement after the slop (no jump when the drag starts)', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['move', 1, 112, 100, 16],
      ['move', 1, 130, 100, 32],
      ['move', 1, 125, 100, 48],
    ]);
    expect(effects).toEqual([
      { type: 'dragStart' },
      { type: 'rotate', dx: 18 },
      { type: 'rotate', dx: -5 },
    ]);
  });

  it('releases with the speed of the last ~80 ms', () => {
    const { effects } = run([
      ['down', 1, 0, 0, 0],
      ['move', 1, 20, 0, 10],
      ['move', 1, 40, 0, 20],
      ['move', 1, 60, 0, 30],
      ['up', 1, 80, 0, 40],
    ]);
    const release = effects.at(-1);
    expect(release?.type).toBe('release');
    if (release?.type === 'release') expect(release.velocity).toBeCloseTo(2);
  });

  it('a finger that stopped before lifting releases without spin', () => {
    const { effects } = run([
      ['down', 1, 0, 0, 0],
      ['move', 1, 50, 0, 10],
      ['move', 1, 100, 0, 20],
      ['up', 1, 100, 0, 400],
    ]);
    expect(effects.at(-1)).toEqual({ type: 'release', velocity: 0 });
  });

  it('releaseVelocity needs two samples at least 1 ms apart', () => {
    expect(releaseVelocity([], 0)).toBe(0);
    expect(releaseVelocity([{ x: 0, t: 5 }], 5)).toBe(0);
    expect(
      releaseVelocity(
        [
          { x: 0, t: 5 },
          { x: 10, t: 5 },
        ],
        5,
      ),
    ).toBe(0);
  });
});

describe('gesture: pinch', () => {
  it('zooms by the ratio of finger distances', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['down', 2, 200, 100, 0],
      ['move', 2, 300, 100, 16],
      ['move', 1, 200, 100, 32],
    ]);
    expect(effects).toHaveLength(2);
    const [a, b] = effects;
    expect(a).toEqual({ type: 'zoom', factor: 2 });
    expect(b?.type).toBe('zoom');
    if (b?.type === 'zoom') expect(b.factor).toBeCloseTo(0.5);
  });

  it('ignores a third finger', () => {
    const { state } = run([
      ['down', 1, 0, 0, 0],
      ['down', 2, 10, 0, 0],
      ['down', 3, 20, 0, 0],
    ]);
    expect(Object.keys(state.pointers)).toEqual(['1', '2']);
  });

  it('the finger left after a pinch neither taps nor jumps; it may drag on from where it is', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['down', 2, 300, 100, 0],
      ['move', 1, 60, 100, 16],
      ['up', 2, 300, 100, 32],
      // The remaining finger at x = 60 moves by 4 px: below the slop, nothing happens.
      ['move', 1, 64, 100, 48],
      // Then a real drag: it starts from x = 60, not from the pinch start (no jump).
      ['move', 1, 80, 100, 64],
      ['move', 1, 90, 100, 80],
      ['up', 1, 90, 100, 96],
    ]);
    expect(effects.map((e) => e.type)).toEqual(['zoom', 'dragStart', 'rotate', 'release']);
    expect(effects[2]).toEqual({ type: 'rotate', dx: 10 });
  });

  it('a lifted pinch finger that does not move ends without a tap', () => {
    const { effects } = run([
      ['down', 1, 100, 100, 0],
      ['down', 2, 300, 100, 0],
      ['up', 2, 300, 100, 32],
      ['up', 1, 100, 100, 64],
    ]);
    expect(effects).toEqual([]);
  });

  it('cancelling one pinch finger keeps the other tracked but never as a tap', () => {
    const { effects, state } = run([
      ['down', 1, 100, 100, 0],
      ['down', 2, 300, 100, 0],
      ['cancel', 2],
      ['up', 1, 100, 100, 50],
    ]);
    expect(effects).toEqual([]);
    expect(state).toEqual(IDLE);
  });
});
