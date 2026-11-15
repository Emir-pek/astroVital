import type { BodyRegionId } from '@core/types';
import type { Vec3 } from './orbit';

/*
 * Figure-space anatomy of the 3D astronaut (spec 2026-11-15 §3.1). Metres, y up, soles at y = 0,
 * helmet top ≈ 1.83, the astronaut faces +Z. The astronaut's LEFT is +X, i.e. the viewer's right.
 * buildAstronaut.ts builds the suit from JOINTS, so hit points and anchors stay on the drawing.
 */

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
/** The same point on the astronaut's left (+X) and right (−X) side. */
const both = (x: number, y: number, z: number): Vec3[] => [v(x, y, z), v(-x, y, z)];

/** Joint centres of the astronaut's LEFT side (+X); the right side mirrors x. Calm A-pose. */
export const JOINTS = {
  shoulder: v(0.28, 1.445, 0),
  elbow: v(0.37, 1.135, 0.03),
  wrist: v(0.415, 0.865, 0.06),
  hip: v(0.11, 0.93, 0),
  knee: v(0.13, 0.52, 0.025),
  ankle: v(0.145, 0.12, 0),
  waist: v(0, 1.02, 0),
  neck: v(0, 1.52, 0),
  helmet: v(0, 1.655, 0.005),
} as const;

export const HELMET_RADIUS = 0.178;

/** Mirror a left-side point to the astronaut's right side. */
export const mirror = (p: Vec3): Vec3 => v(-p.x, p.y, p.z);

/**
 * Leader-line anchor of every region, on (or in) its organ. At yaw 0, each label column's anchors
 * run top to bottom in the order of its labels (layout.ts COLUMNS) and sit on that column's side
 * (left column on −X, right column on +X), so no two leader lines cross.
 */
export const REGION_ANCHORS_3D: Record<BodyRegionId, Vec3> = {
  brain: v(-0.04, 1.74, 0.02), // top of the right hemisphere
  immune: v(-0.17, 1.38, 0.02), // right armpit lymph node
  lungs: v(-0.09, 1.3, 0.06), // right lung
  bones: v(-0.12, 0.72, 0), // right femur
  whole_body: v(-0.13, 0.1, 0.1), // right boot
  eyes: v(0.032, 1.655, 0.09), // left eye
  heart: v(0.035, 1.3, 0.06),
  kidneys: v(0.075, 1.07, -0.06), // left kidney
  muscles: v(0.12, 0.72, 0.06), // left quadriceps
  blood: v(0.13, 0.32, 0.03), // left shin vessel
};

/**
 * Points on the SUIT surface that stand for a region: a tap on the suit selects the region whose
 * nearest hit point is within pick distance (pick.ts). Visible organs (x-ray ghosts, the selected
 * organ) are picked directly instead.
 *
 * The map follows the leader lines, so a tap where a leader ends selects that leader's region:
 * the right thigh is "bones" (right femur), the left thigh "muscles", the left shin "blood", the
 * boots "whole body", the upper visor "brain" and its lower half "eyes". Body parts without a
 * leader get the region that lives there (upper arms = muscles, forearms and wrists = blood, neck
 * sides and groin = lymph nodes, lower back = kidneys, backpack = whole body).
 */
export const HIT_POINTS: Record<BodyRegionId, readonly Vec3[]> = {
  brain: [
    v(0, 1.83, 0),
    v(0, 1.77, -0.13),
    ...both(0.14, 1.75, 0),
    v(0, 1.66, -0.18),
    v(0, 1.745, 0.165),
    ...both(0.055, 1.73, 0.168),
  ],
  eyes: [...both(0.035, 1.655, 0.18), v(0, 1.62, 0.18), ...both(0.09, 1.65, 0.16)],
  heart: [v(0.035, 1.3, 0.168), v(0.075, 1.33, 0.16), v(0.03, 1.25, 0.17)],
  lungs: [v(-0.09, 1.3, 0.168), v(-0.09, 1.4, 0.16), v(-0.14, 1.22, 0.15), v(0.14, 1.41, 0.14)],
  immune: [
    v(-0.18, 1.39, 0.12),
    ...both(0.25, 1.36, 0),
    ...both(0.1, 1.53, 0.06),
    ...both(0.08, 0.86, 0.14),
    v(0.21, 1.17, 0),
  ],
  kidneys: [
    ...both(0.075, 1.07, 0.15),
    ...both(0.1, 1.06, -0.36),
    ...both(0.1, 1.0, -0.17),
    ...both(0.19, 1.06, 0),
  ],
  bones: [
    v(-0.12, 0.75, 0.095),
    v(-0.125, 0.62, 0.09),
    v(-0.13, 0.52, 0.11),
    v(-0.135, 0.33, 0.085),
    v(-0.22, 0.72, 0),
    v(-0.12, 0.72, -0.095),
    ...both(0.29, 1.53, 0),
    ...both(0.21, 0.93, 0),
  ],
  muscles: [
    v(0.12, 0.75, 0.095),
    v(0.125, 0.62, 0.09),
    v(0.22, 0.72, 0),
    v(0.12, 0.72, -0.095),
    ...both(0.33, 1.3, 0.06),
    ...both(0.355, 1.2, 0.05),
  ],
  blood: [
    v(0.135, 0.35, 0.088),
    v(0.14, 0.24, 0.085),
    v(0.135, 0.32, -0.085),
    v(0.13, 0.5, 0.11),
    ...both(0.395, 1.0, 0.08),
    ...both(0.42, 0.8, 0.09),
    v(0, 1.5, 0.14),
  ],
  whole_body: [...both(0.145, 0.09, 0.2), ...both(0.145, 0.1, -0.08), v(0, 1.3, -0.36)],
};

/**
 * Where the camera goes when a region is selected. `span` is how many metres of figure fill the
 * figure box (smaller = closer); `'fit'` shows the whole figure. Kidneys are seen from the back.
 */
export interface FocusView {
  yaw: number;
  target: Vec3;
  span: number | 'fit';
}

export const FOCUS_VIEWS: Record<BodyRegionId, FocusView> = {
  brain: { yaw: 0.4, target: v(0, 1.69, 0), span: 0.44 },
  eyes: { yaw: 0, target: v(0, 1.66, 0.04), span: 0.34 },
  heart: { yaw: -0.4, target: v(0.02, 1.31, 0.03), span: 0.44 },
  lungs: { yaw: 0, target: v(0, 1.3, 0), span: 0.56 },
  kidneys: { yaw: Math.PI, target: v(0, 1.07, -0.05), span: 0.5 },
  immune: { yaw: 0, target: v(0, 1.2, 0), span: 0.95 },
  bones: { yaw: 0.45, target: v(0, 0.93, 0), span: 'fit' },
  muscles: { yaw: -0.45, target: v(0, 0.93, 0), span: 'fit' },
  blood: { yaw: 0, target: v(0, 0.93, 0), span: 'fit' },
  whole_body: { yaw: 0, target: v(0, 0.93, 0), span: 'fit' },
};
