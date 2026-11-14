import type { BodyRegionId } from '@core/types';

/** Figure stage in CSS px — the SVG viewBox and the hit-area overlay share it 1:1. */
export const STAGE = { width: 584, height: 520 } as const;

/** Glove-sized touch target (20 mm ≈ 104 CSS px on the target iPad, spec §5.4). */
export const HIT_SIZE = 104;

/**
 * Invisible tap boxes (top-left corner, px inside STAGE), four rows at top 0/120/240/360 with
 * 16 px gaps. Every box overlaps at least one of its region's glow shapes (see geometry.ts),
 * except `immune`: its neck and armpit nodes sit inside the helmet/chest boxes, and four
 * 104 px boxes cannot share the chest row, so its box sits beside the near armpit. The region
 * chips are the second way in for small or crowded regions.
 */
export const HIT_AREAS: Record<BodyRegionId, { left: number; top: number }> = {
  brain: { left: 188, top: 0 }, // back/top of the helmet
  eyes: { left: 308, top: 0 }, // visor
  immune: { left: 68, top: 120 }, // beside the near armpit node
  lungs: { left: 188, top: 120 }, // near lung
  heart: { left: 308, top: 120 }, // heart (astronaut's left = viewer's right)
  blood: { left: 126, top: 240 }, // near forearm vessel
  kidneys: { left: 246, top: 240 }, // lower back, above the waist ring
  whole_body: { left: 366, top: 240 }, // halo along the far forearm and glove
  muscles: { left: 188, top: 360 }, // near thigh
  bones: { left: 308, top: 360 }, // far femur / tibia
};
