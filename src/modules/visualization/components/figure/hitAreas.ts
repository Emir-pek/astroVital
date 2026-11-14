import type { BodyRegionId } from '@core/types';

/** Figure stage in CSS px — the SVG viewBox and the hit-area overlay share it 1:1. */
export const STAGE = { width: 584, height: 520 } as const;

/** Glove-sized touch target (20 mm ≈ 104 CSS px on the target iPad, spec §5.4). */
export const HIT_SIZE = 104;

/**
 * Invisible tap boxes (top-left corner, px inside STAGE). Four rows at top 0/120/240/360 with
 * 16 px gaps, each box placed over (or next to) the region it opens. Small regions (eyes,
 * immune points, kidneys) get the same 104 px box; the region chips are the second way in.
 */
export const HIT_AREAS: Record<BodyRegionId, { left: number; top: number }> = {
  brain: { left: 180, top: 0 }, // helmet top (left half)
  eyes: { left: 300, top: 0 }, // visor (right half)
  immune: { left: 60, top: 120 }, // neck + armpit (left)
  lungs: { left: 180, top: 120 }, // chest left-centre
  heart: { left: 300, top: 120 }, // chest (astronaut's left = viewer's right)
  muscles: { left: 420, top: 120 }, // upper arm (right)
  blood: { left: 60, top: 240 }, // arm / forearm vessels (left)
  kidneys: { left: 240, top: 240 }, // waist
  whole_body: { left: 420, top: 240 }, // silhouette halo (right)
  bones: { left: 180, top: 360 }, // thigh / shin (left leg)
};
