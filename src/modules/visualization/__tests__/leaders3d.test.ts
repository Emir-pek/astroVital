import { describe, expect, it } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { computeBodyMapLayout, LEADER_SHOULDER } from '../components/figure/layout';
import {
  BEHIND_OPACITY,
  GLYPH_SETBACK,
  glyphPoint,
  leaderPoints,
  writeLeaders,
} from '../components/figure3d/leaders';
import type { BehindMap, Projection } from '../components/figure3d/stageTypes';

const SVG = 'http://www.w3.org/2000/svg';
const layout = computeBodyMapLayout(600, 584);

/** One leader group per region, shaped like ProjectedLeader renders it. */
function makeLeaders(withGlyph: BodyRegionId[] = []) {
  const els = new Map<BodyRegionId, SVGGElement>();
  for (const id of BODY_REGION_IDS) {
    const g = document.createElementNS(SVG, 'g');
    g.setAttribute('visibility', 'hidden');
    g.append(document.createElementNS(SVG, 'polyline'), document.createElementNS(SVG, 'polyline'));
    const dot = document.createElementNS(SVG, 'circle');
    dot.setAttribute('data-end', '');
    g.append(dot);
    if (withGlyph.includes(id)) {
      const glyph = document.createElementNS(SVG, 'g');
      glyph.setAttribute('data-glyph', 'caution');
      g.append(glyph);
    }
    els.set(id, g);
  }
  return els;
}

/** Every anchor in the middle of the figure box, in front of the camera. */
function centred(): Projection {
  const { figure } = layout;
  return Object.fromEntries(
    BODY_REGION_IDS.map((id) => [
      id,
      { x: figure.x + figure.width / 2, y: figure.y + figure.height / 2, inFront: true },
    ]),
  ) as Projection;
}
const noneBehind = () => Object.fromEntries(BODY_REGION_IDS.map((id) => [id, false])) as BehindMap;

describe('leader geometry', () => {
  it('runs from the label edge through a short shoulder to the anchor', () => {
    const left = layout.labels.brain;
    const [edge, shoulder, end] = leaderPoints(left, { x: 300, y: 50 });
    expect(edge.x).toBe(left.x + left.width);
    expect(shoulder.x).toBe(edge.x + LEADER_SHOULDER);
    expect(edge.y).toBe(left.y + left.height / 2);
    expect(end).toEqual({ x: 300, y: 50 });
    const right = layout.labels.heart;
    expect(leaderPoints(right, { x: 300, y: 50 })[1].x).toBe(right.x - LEADER_SHOULDER);
  });

  it('sets the glyph back from the anchor towards the shoulder, never past it', () => {
    expect(glyphPoint({ x: 100, y: 0 }, { x: 0, y: 0 })).toEqual({ x: GLYPH_SETBACK, y: 0 });
    expect(glyphPoint({ x: 10, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 10, y: 0 });
  });
});

describe('writeLeaders', () => {
  it('hides leaders that would cross to the far half of the turned figure, except the selected one', () => {
    const els = makeLeaders();
    const points = centred();
    const centre = layout.figure.x + layout.figure.width / 2;
    points.brain = { x: centre + 60, y: 100, inFront: true }; // left label, anchor on the right half
    points.heart = { x: centre - 60, y: 200, inFront: true }; // right label, anchor on the left half
    writeLeaders(els, layout, null, points, noneBehind());
    expect(els.get('brain')?.getAttribute('visibility')).toBe('hidden');
    expect(els.get('heart')?.getAttribute('visibility')).toBe('hidden');
    writeLeaders(els, layout, 'heart', points, noneBehind());
    expect(els.get('heart')?.getAttribute('visibility')).toBe('visible');
  });

  it('shows every leader for anchors on the figure and writes its geometry', () => {
    const els = makeLeaders(['lungs']);
    writeLeaders(els, layout, null, centred(), noneBehind());
    for (const g of els.values()) {
      expect(g.getAttribute('visibility')).toBe('visible');
      expect(g.getAttribute('opacity')).toBe('1');
      expect(g.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(3);
    }
    const dot = els.get('heart')?.querySelector('[data-end]');
    expect(dot?.getAttribute('cx')).toBe((layout.figure.x + layout.figure.width / 2).toFixed(1));
    expect(els.get('lungs')?.querySelector('[data-glyph]')?.getAttribute('transform')).toMatch(
      /^translate\(/,
    );
  });

  it('while a region is selected only its leader shows', () => {
    const els = makeLeaders();
    writeLeaders(els, layout, 'kidneys', centred(), noneBehind());
    for (const [id, g] of els) {
      expect(g.getAttribute('visibility')).toBe(id === 'kidneys' ? 'visible' : 'hidden');
    }
  });

  it('dims leaders whose anchor is behind the figure, but never the selected one', () => {
    const els = makeLeaders();
    const behind = { ...noneBehind(), bones: true, kidneys: true };
    writeLeaders(els, layout, null, centred(), behind);
    expect(els.get('bones')?.getAttribute('opacity')).toBe(String(BEHIND_OPACITY));
    writeLeaders(els, layout, 'kidneys', centred(), behind);
    expect(els.get('kidneys')?.getAttribute('opacity')).toBe('1');
  });

  it('hides leaders whose anchor is off the container, behind the camera or over its own label', () => {
    const els = makeLeaders();
    const points = centred();
    points.brain = { x: -20, y: 100, inFront: true };
    points.eyes = { x: 300, y: 100, inFront: false };
    points.lungs = { x: layout.labels.lungs.x + 20, y: 300, inFront: true }; // under its label
    points.heart = { x: Number.NaN, y: 0, inFront: true };
    points.muscles = { x: 300, y: 4, inFront: true }; // at the very top edge
    writeLeaders(els, layout, null, points, noneBehind());
    for (const id of ['brain', 'eyes', 'lungs', 'heart', 'muscles'] as const) {
      expect(els.get(id)?.getAttribute('visibility')).toBe('hidden');
    }
    expect(els.get('kidneys')?.getAttribute('visibility')).toBe('visible');
  });
});
