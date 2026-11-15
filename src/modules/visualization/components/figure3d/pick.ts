import type { BodyRegionId } from '@core/types';
import type { Vec3 } from './orbit';

/** Farthest a suit hit may be from a region's hit point and still select that region (m). */
export const PICK_DISTANCE = 0.16;

/**
 * Region of a tap on the suit: the region owning the nearest hit point within `maxDist`,
 * otherwise the whole body (the suit itself is the whole_body region).
 */
export function pickRegion(
  hit: Vec3,
  hitPoints: Readonly<Record<BodyRegionId, readonly Vec3[]>>,
  maxDist = PICK_DISTANCE,
): BodyRegionId {
  let best: BodyRegionId = 'whole_body';
  let bestDist = maxDist;
  for (const [region, points] of Object.entries(hitPoints) as [BodyRegionId, readonly Vec3[]][]) {
    for (const p of points) {
      const d = Math.hypot(hit.x - p.x, hit.y - p.y, hit.z - p.z);
      if (d <= bestDist) {
        bestDist = d;
        best = region;
      }
    }
  }
  return best;
}

/** The minimal shape of a scene-graph node (three's Object3D satisfies it). */
export interface SceneNode {
  visible: boolean;
  userData: Record<string, unknown>;
  parent: SceneNode | null;
}

const isRegionTag = (value: unknown): value is BodyRegionId =>
  typeof value === 'string' && value.length > 0;

/**
 * Walks up from a hit object. Returns `{ visible: false }` when the object or an ancestor is hidden
 * (raycasting ignores visibility, a hidden organ must not catch taps), otherwise the region tag of
 * the nearest ancestor with `userData.region` (organ groups carry one, the suit does not).
 */
export function regionOfNode(node: SceneNode): { visible: boolean; region: BodyRegionId | null } {
  let region: BodyRegionId | null = null;
  for (let n: SceneNode | null = node; n; n = n.parent) {
    if (!n.visible) return { visible: false, region: null };
    const tag = n.userData.region;
    if (region === null && isRegionTag(tag)) region = tag;
  }
  return { visible: true, region };
}

export interface RayHit {
  object: SceneNode;
  /** Hit point in figure space. */
  point: Vec3;
}

/**
 * Region of a tap from the ray hits (nearest first): the first VISIBLE hit decides; an organ hit
 * wins directly, a suit hit is mapped through `hitPoints`. Null when nothing visible was hit
 * (a tap beside the figure).
 */
export function regionOfHits(
  hits: readonly RayHit[],
  hitPoints: Readonly<Record<BodyRegionId, readonly Vec3[]>>,
  organsFirst: boolean,
): BodyRegionId | null {
  const visible = hits
    .map((h) => ({ hit: h, info: regionOfNode(h.object) }))
    .filter((h) => h.info.visible);
  if (visible.length === 0) return null;
  if (organsFirst) {
    const organ = visible.find((h) => h.info.region !== null);
    if (organ) return organ.info.region;
  }
  const first = visible[0]!;
  return first.info.region ?? pickRegion(first.hit.point, hitPoints);
}
