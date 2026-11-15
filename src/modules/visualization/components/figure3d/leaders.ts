import type { BodyRegionId } from '@core/types';
import {
  LEADER_SHOULDER,
  type BodyMapLayout,
  type LabelPlacement,
  type Point,
} from '../figure/layout';
import type { BehindMap, Projection } from './stageTypes';

/*
 * Leader lines of the 3D figure (spec 2026-11-15 §3.1): after every rendered 3D frame the anchors
 * are projected to container px and the leaders are written straight into the SVG DOM — no React
 * re-render per frame. Pure geometry + a DOM writer, tested in jsdom.
 */

/** How far back from the anchor an alert glyph sits along its leader (px). */
export const GLYPH_SETBACK = 24;
/** Opacity of a leader whose anchor is on the far side of the turned figure. */
export const BEHIND_OPACITY = 0.35;
/** Anchors closer than this to the container edge (zoomed in) get no leader (px). */
export const EDGE_MARGIN = 16;
/** How far past the figure's centre line an anchor may sit and still keep its leader (px). */
export const CENTRE_TOLERANCE = 16;

/** Where an alert glyph sits: set back from the anchor along the leader, towards the shoulder. */
export function glyphPoint(shoulder: Point, end: Point): Point {
  const dx = shoulder.x - end.x;
  const dy = shoulder.y - end.y;
  const length = Math.hypot(dx, dy) || 1;
  const setback = Math.min(GLYPH_SETBACK, length);
  return { x: end.x + (dx / length) * setback, y: end.y + (dy / length) * setback };
}

/** Leader polyline of a label to an anchor: label edge → short shoulder → anchor. */
export function leaderPoints(label: LabelPlacement, end: Point): [Point, Point, Point] {
  const cy = label.y + label.height / 2;
  const edgeX = label.side === 'left' ? label.x + label.width : label.x;
  const shoulderX = label.side === 'left' ? edgeX + LEADER_SHOULDER : edgeX - LEADER_SHOULDER;
  return [{ x: edgeX, y: cy }, { x: shoulderX, y: cy }, end];
}

/**
 * Writes one projected frame into the leader DOM. A leader is shown only when its anchor is on
 * screen, not at the container's very edge, on the figure side of its label's shoulder (never
 * running back over the label) and on its column's half of the figure (never crossing it); while
 * a region is selected only that region's leader is shown, wherever its anchor is.
 */
export function writeLeaders(
  els: ReadonlyMap<BodyRegionId, SVGGElement>,
  layout: BodyMapLayout,
  selected: BodyRegionId | null,
  points: Projection,
  behind: BehindMap,
) {
  for (const [id, g] of els) {
    const p = points[id];
    const label = layout.labels[id];
    const [edge, shoulder, end] = leaderPoints(label, { x: p.x, y: p.y });
    const inside =
      p.inFront &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      p.x >= EDGE_MARGIN &&
      p.x <= layout.width - EDGE_MARGIN &&
      p.y >= EDGE_MARGIN &&
      p.y <= layout.height - EDGE_MARGIN;
    const figureSide = label.side === 'left' ? end.x > shoulder.x : end.x < shoulder.x;
    // Once the figure turns, anchors swap sides; a leader that would cross the figure to the far
    // half is hidden (the selected region's leader always stays).
    const centreX = layout.figure.x + layout.figure.width / 2;
    const ownHalf =
      selected === id ||
      (label.side === 'left'
        ? end.x <= centreX + CENTRE_TOLERANCE
        : end.x >= centreX - CENTRE_TOLERANCE);
    if (!inside || !figureSide || !ownHalf || (selected !== null && selected !== id)) {
      g.setAttribute('visibility', 'hidden');
      continue;
    }
    g.setAttribute('visibility', 'visible');
    g.setAttribute('opacity', behind[id] && selected !== id ? String(BEHIND_OPACITY) : '1');
    const d = [edge, shoulder, end].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
    for (const line of g.querySelectorAll('polyline')) line.setAttribute('points', d);
    const dot = g.querySelector('[data-end]');
    dot?.setAttribute('cx', end.x.toFixed(1));
    dot?.setAttribute('cy', end.y.toFixed(1));
    const glyph = glyphPoint(shoulder, end);
    g.querySelector('[data-glyph]')?.setAttribute(
      'transform',
      `translate(${glyph.x.toFixed(1)} ${glyph.y.toFixed(1)})`,
    );
  }
}
