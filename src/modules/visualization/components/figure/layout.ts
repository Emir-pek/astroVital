import type { BodyRegionId } from '@core/types';

/*
 * Pure layout of the Status-screen body map (spec §7.1, §8, ADR-036): the figure scales with its
 * container, ten glove-sized region labels stand in two columns beside it, and a thin leader line
 * runs from every label to its anatomical anchor on the figure.
 *
 * Everything here is in CSS px of the body-map container, except the anchors, which are in the
 * figure's authoring space (geometry.ts) and are mapped through the figure box.
 */

/** The part of the authoring space the figure layers show (suit + halo margin + floor shadow). */
export const FIGURE_VIEWBOX = { x: 182, y: 8, width: 226, height: 512 } as const;
export const FIGURE_VIEWBOX_ATTR = `${FIGURE_VIEWBOX.x} ${FIGURE_VIEWBOX.y} ${FIGURE_VIEWBOX.width} ${FIGURE_VIEWBOX.height}`;
const FIGURE_ASPECT = FIGURE_VIEWBOX.width / FIGURE_VIEWBOX.height;

/** Region label box: glove-sized (20 mm ≈ 104 CSS px, spec §5.4); width fits two-line names. */
export const LABEL = { width: 152, height: 104, gap: 16 } as const;
export const LABELS_PER_SIDE = 5;
/** Height of one full label column: 5 × 104 + 4 × 16 = 584 px. The map is never shorter. */
export const LABEL_STACK_HEIGHT =
  LABELS_PER_SIDE * LABEL.height + (LABELS_PER_SIDE - 1) * LABEL.gap;

/** Horizontal room between a label column and the figure box (px). */
const MIN_SPACE = 12;
const MAX_SPACE = 56;
/** Short horizontal run of every leader line before it turns towards its anchor (px). */
export const LEADER_SHOULDER = 10;

export type Side = 'left' | 'right';

/**
 * Label columns, top to bottom. Sides follow the anatomy (the far side of the ¾-turned figure is
 * on the right), and the order keeps every column's anchors in the same vertical order as its
 * labels, so no two leader lines can cross. Rows 1–3 carry the regions that only exist high on
 * the body (head, chest, waist); rows 4–5 the ones that run down the legs.
 */
export const COLUMNS: Record<Side, readonly BodyRegionId[]> = {
  left: ['brain', 'immune', 'lungs', 'bones', 'whole_body'],
  right: ['eyes', 'heart', 'kidneys', 'muscles', 'blood'],
};

/** Anatomical anchor of each region in authoring space (see REGION_SHAPES in geometry.ts). */
export const REGION_ANCHORS: Record<BodyRegionId, { x: number; y: number }> = {
  brain: { x: 294, y: 38 }, // upper helmet, behind the visor top
  immune: { x: 246, y: 143 }, // near armpit node
  lungs: { x: 280, y: 160 }, // lower lobe of the near lung
  bones: { x: 276, y: 336 }, // near femur
  whole_body: { x: 257, y: 476 }, // the silhouette edge at the near boot (halo)
  eyes: { x: 322, y: 58 }, // visor
  heart: { x: 330, y: 144 }, // heart (astronaut's left = viewer's right)
  kidneys: { x: 330, y: 214 }, // far kidney, at the waist bearing
  muscles: { x: 338, y: 330 }, // far thigh
  blood: { x: 345, y: 428 }, // far shin vessel tract
};

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LabelPlacement extends Box {
  side: Side;
}

export interface BodyMapLayout {
  width: number;
  height: number;
  figure: Box;
  labels: Record<BodyRegionId, LabelPlacement>;
  /** Anchor of every region in container px. */
  anchors: Record<BodyRegionId, Point>;
  /** Leader polyline per region: label edge → shoulder → anchor. */
  leaders: Record<BodyRegionId, [Point, Point, Point]>;
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Tops of one label column: as close as possible to the anchors' heights, never closer than
 * label height + 16 px, never outside 0..height (height ≥ LABEL_STACK_HEIGHT).
 */
export function placeColumn(idealCenters: readonly number[], height: number): number[] {
  const pitch = LABEL.height + LABEL.gap;
  const tops = idealCenters.map((c) => c - LABEL.height / 2);
  for (let i = 0; i < tops.length; i++) {
    const floor = i === 0 ? 0 : tops[i - 1]! + pitch;
    tops[i] = Math.max(tops[i]!, floor);
  }
  for (let i = tops.length - 1; i >= 0; i--) {
    const ceiling = i === tops.length - 1 ? height - LABEL.height : tops[i + 1]! - pitch;
    tops[i] = Math.min(tops[i]!, ceiling);
  }
  return tops.map(round);
}

/** Lays out figure, labels and leader lines inside a `width × height` container. */
export function computeBodyMapLayout(width: number, height: number): BodyMapLayout {
  const h = Math.max(height, LABEL_STACK_HEIGHT);
  const roomForFigure = Math.max(0, width - 2 * LABEL.width - 2 * MIN_SPACE);
  const figH = Math.min(h, roomForFigure / FIGURE_ASPECT);
  const figW = figH * FIGURE_ASPECT;
  const space = clamp((width - 2 * LABEL.width - figW) / 2, MIN_SPACE, MAX_SPACE);
  const groupW = 2 * LABEL.width + 2 * space + figW;
  const x0 = Math.max(0, (width - groupW) / 2);

  const figure: Box = {
    x: round(x0 + LABEL.width + space),
    y: round((h - figH) / 2),
    width: round(figW),
    height: round(figH),
  };
  const scale = figH / FIGURE_VIEWBOX.height;
  const toContainer = (p: Point): Point => ({
    x: round(figure.x + (p.x - FIGURE_VIEWBOX.x) * scale),
    y: round(figure.y + (p.y - FIGURE_VIEWBOX.y) * scale),
  });

  const anchors = Object.fromEntries(
    Object.entries(REGION_ANCHORS).map(([id, p]) => [id, toContainer(p)]),
  ) as Record<BodyRegionId, Point>;

  const labels = {} as Record<BodyRegionId, LabelPlacement>;
  const leaders = {} as Record<BodyRegionId, [Point, Point, Point]>;
  const columnX: Record<Side, number> = {
    left: round(x0),
    right: round(x0 + groupW - LABEL.width),
  };

  for (const side of ['left', 'right'] as const) {
    const ids = COLUMNS[side];
    const tops = placeColumn(
      ids.map((id) => anchors[id].y),
      h,
    );
    ids.forEach((id, i) => {
      const top = tops[i]!;
      labels[id] = { side, x: columnX[side], y: top, width: LABEL.width, height: LABEL.height };
      const cy = round(top + LABEL.height / 2);
      const edgeX = side === 'left' ? columnX.left + LABEL.width : columnX.right;
      const shoulderX = side === 'left' ? edgeX + LEADER_SHOULDER : edgeX - LEADER_SHOULDER;
      leaders[id] = [{ x: round(edgeX), y: cy }, { x: round(shoulderX), y: cy }, anchors[id]];
    });
  }

  return { width: round(width), height: h, figure, labels, anchors, leaders };
}
