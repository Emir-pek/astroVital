import { describe, expect, it } from 'vitest';
import {
  FIGURE_BOX,
  REGION_SHAPES,
  tract,
  type InnerRegionId,
  type Shape,
} from '../components/figure/geometry';
import { FIGURE_VIEWBOX, REGION_ANCHORS } from '../components/figure/layout';

/** Axis-aligned bounds of a shape (rotation ignored: the ellipses are only slightly tilted). */
function bounds(s: Shape) {
  switch (s.kind) {
    case 'circle':
      return { x0: s.cx - s.r, x1: s.cx + s.r, y0: s.cy - s.r, y1: s.cy + s.r };
    case 'ellipse':
      return { x0: s.cx - s.rx, x1: s.cx + s.rx, y0: s.cy - s.ry, y1: s.cy + s.ry };
    case 'path': {
      const xs: number[] = [];
      const ys: number[] = [];
      // End points of M/L commands and of arcs (A rx ry rot large sweep x y); the arc bulges
      // are small round caps, so the end points bound the band.
      const num = '-?\\d+(?:\\.\\d+)?';
      const re = new RegExp(`(?:[ML]|A(?: ${num}){5}) (${num}) (${num})`, 'g');
      for (const m of s.d.matchAll(re)) {
        xs.push(Number(m[1]));
        ys.push(Number(m[2]));
      }
      expect(xs.length).toBeGreaterThan(0);
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    }
  }
}

describe('figure geometry', () => {
  it('tract() builds a closed band with the given end widths', () => {
    const band = tract(0, 0, 0, 100, 14, 8);
    expect(band.kind).toBe('path');
    if (band.kind !== 'path') return;
    expect(band.d.trim().endsWith('Z')).toBe(true);
    const b = bounds(band);
    expect(b.x1 - b.x0).toBeCloseTo(14, 5);
    expect(b.y1 - b.y0).toBeCloseTo(100, 5);
  });

  it('draws vessels as filled tracts at least 6 px wide, never as thin lines', () => {
    for (const s of REGION_SHAPES.blood.shapes) {
      expect(s.kind).toBe('path');
      const b = bounds(s);
      expect(Math.min(b.x1 - b.x0, b.y1 - b.y0)).toBeGreaterThanOrEqual(6);
    }
  });

  it('puts every inner-region anchor on one of that region’s shapes', () => {
    const missing: string[] = [];
    for (const id of Object.keys(REGION_SHAPES) as InnerRegionId[]) {
      const a = REGION_ANCHORS[id];
      const hit = REGION_SHAPES[id].shapes.some((s) => {
        const b = bounds(s);
        return a.x >= b.x0 && a.x <= b.x1 && a.y >= b.y0 && a.y <= b.y1;
      });
      if (!hit) missing.push(id);
    }
    expect(missing).toEqual([]);
  });

  it('keeps every region shape and anchor inside the figure crop', () => {
    const inside = (x: number, y: number) =>
      x > FIGURE_VIEWBOX.x &&
      x < FIGURE_VIEWBOX.x + FIGURE_VIEWBOX.width &&
      y > FIGURE_VIEWBOX.y &&
      y < FIGURE_VIEWBOX.y + FIGURE_VIEWBOX.height;
    for (const shapes of Object.values(REGION_SHAPES)) {
      for (const s of shapes.shapes) {
        const b = bounds(s);
        expect(inside(b.x0, b.y0) && inside(b.x1, b.y1)).toBe(true);
      }
    }
    for (const a of Object.values(REGION_ANCHORS)) expect(inside(a.x, a.y)).toBe(true);
    expect(FIGURE_BOX).toEqual(FIGURE_VIEWBOX);
  });
});
