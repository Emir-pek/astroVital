import { describe, expect, it } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import {
  COLUMNS,
  LABEL,
  LABEL_STACK_HEIGHT,
  computeBodyMapLayout,
  placeColumn,
  type Box,
  type Point,
} from '../components/figure/layout';

/** Container sizes of the body-map pane: iPad 1180×820, laptop 1366×768, 1440×900, narrow. */
const SIZES: Array<[number, number]> = [
  [600, 588],
  [714, 584],
  [760, 668],
  [520, 584],
];

/** Free distance between two boxes along the axis that separates them (negative = overlap). */
function gapBetween(a: Box, b: Box): number {
  const horizontal = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const vertical = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  return Math.max(horizontal, vertical);
}

const cross = (o: Point, a: Point, b: Point) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** True when segments p1p2 and q1q2 properly intersect. */
function segmentsCross(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const d1 = cross(q1, q2, p1);
  const d2 = cross(q1, q2, p2);
  const d3 = cross(p1, p2, q1);
  const d4 = cross(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

describe('body map layout', () => {
  it('the label stack is 5 × 104 px + 4 × 16 px', () => {
    expect(LABEL.height).toBe(104);
    expect(LABEL.gap).toBe(16);
    expect(LABEL_STACK_HEIGHT).toBe(584);
  });

  it('puts every region in exactly one column, five per side', () => {
    expect(COLUMNS.left).toHaveLength(5);
    expect(COLUMNS.right).toHaveLength(5);
    expect([...COLUMNS.left, ...COLUMNS.right].sort()).toEqual([...BODY_REGION_IDS].sort());
  });

  it('gapBetween detects overlap and exact gaps', () => {
    const box = (x: number, y: number): Box => ({ x, y, width: 104, height: 104 });
    expect(gapBetween(box(0, 0), box(50, 0))).toBeLessThan(0);
    expect(gapBetween(box(0, 0), box(120, 0))).toBe(16);
    expect(gapBetween(box(0, 120), box(0, 0))).toBe(16);
  });

  it('segmentsCross finds a crossing and ignores parallel segments', () => {
    const p = (x: number, y: number): Point => ({ x, y });
    expect(segmentsCross(p(0, 0), p(10, 10), p(0, 10), p(10, 0))).toBe(true);
    expect(segmentsCross(p(0, 0), p(10, 0), p(0, 5), p(10, 5))).toBe(false);
  });

  it('placeColumn packs labels evenly when there is no slack', () => {
    expect(placeColumn([0, 0, 0, 0, 0], LABEL_STACK_HEIGHT)).toEqual([0, 120, 240, 360, 480]);
  });

  it('placeColumn follows the anchors when there is room', () => {
    expect(placeColumn([60, 300, 600], 700)).toEqual([8, 248, 548]);
  });

  describe.each(SIZES)('in a %i × %i container', (width, height) => {
    const layout = computeBodyMapLayout(width, height);
    const labels = BODY_REGION_IDS.map((id) => layout.labels[id]);

    it('is never shorter than one label column', () => {
      expect(layout.height).toBeGreaterThanOrEqual(LABEL_STACK_HEIGHT);
    });

    it('keeps every label glove-sized and inside the container', () => {
      for (const l of labels) {
        expect(l.width).toBeGreaterThanOrEqual(104);
        expect(l.height).toBeGreaterThanOrEqual(104);
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.x + l.width).toBeLessThanOrEqual(width + 0.5);
        expect(l.y + l.height).toBeLessThanOrEqual(layout.height + 0.5);
      }
    });

    it('keeps >= 16 px between every pair of labels', () => {
      const tooClose: string[] = [];
      BODY_REGION_IDS.forEach((a: BodyRegionId, i) => {
        BODY_REGION_IDS.slice(i + 1).forEach((b: BodyRegionId) => {
          if (gapBetween(layout.labels[a], layout.labels[b]) < 16 - 0.01)
            tooClose.push(`${a}/${b}`);
        });
      });
      expect(tooClose).toEqual([]);
    });

    it('never lets a label overlap the figure box', () => {
      for (const l of labels) expect(gapBetween(l, layout.figure)).toBeGreaterThan(0);
    });

    it('puts every anchor inside the figure box', () => {
      const f = layout.figure;
      for (const id of BODY_REGION_IDS) {
        const a = layout.anchors[id];
        expect(a.x).toBeGreaterThan(f.x);
        expect(a.x).toBeLessThan(f.x + f.width);
        expect(a.y).toBeGreaterThan(f.y);
        expect(a.y).toBeLessThan(f.y + f.height);
      }
    });

    it('starts every leader at its own label edge and ends it at the anchor', () => {
      for (const id of BODY_REGION_IDS) {
        const [edge, , end] = layout.leaders[id];
        const l = layout.labels[id];
        expect(edge.x).toBe(l.side === 'left' ? l.x + l.width : l.x);
        expect(edge.y).toBeCloseTo(l.y + l.height / 2, 0);
        expect(end).toEqual(layout.anchors[id]);
      }
    });

    it('draws no two leader lines across each other', () => {
      const crossings: string[] = [];
      BODY_REGION_IDS.forEach((a: BodyRegionId, i) => {
        BODY_REGION_IDS.slice(i + 1).forEach((b: BodyRegionId) => {
          const [a0, a1, a2] = layout.leaders[a];
          const [b0, b1, b2] = layout.leaders[b];
          for (const [p, q] of [
            [a0, a1],
            [a1, a2],
          ] as const) {
            for (const [r, s] of [
              [b0, b1],
              [b1, b2],
            ] as const) {
              if (segmentsCross(p, q, r, s)) crossings.push(`${a}/${b}`);
            }
          }
        });
      });
      expect(crossings).toEqual([]);
    });
  });

  it('scales the figure to fill the height of the iPad pane (≈ 570 px)', () => {
    const { figure } = computeBodyMapLayout(600, 588);
    expect(figure.height).toBeGreaterThanOrEqual(540);
    expect(figure.height).toBeLessThanOrEqual(588);
  });

  it('grows the figure with a taller container', () => {
    const small = computeBodyMapLayout(760, 588).figure.height;
    const tall = computeBodyMapLayout(760, 668).figure.height;
    expect(tall).toBeGreaterThan(small);
  });
});
