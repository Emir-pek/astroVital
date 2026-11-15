import { describe, expect, it } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { FOCUS_VIEWS, HIT_POINTS, JOINTS, REGION_ANCHORS_3D } from '../components/figure3d/anatomy';
import {
  PICK_DISTANCE,
  pickRegion,
  regionOfHits,
  regionOfNode,
  type SceneNode,
} from '../components/figure3d/pick';
import { COLUMNS } from '../components/figure/layout';

describe('3D anchors', () => {
  it('every region has an anchor', () => {
    for (const id of BODY_REGION_IDS) expect(REGION_ANCHORS_3D[id]).toBeDefined();
  });

  it('at yaw 0 each column’s anchors run top to bottom in label order (leaders never cross)', () => {
    for (const side of ['left', 'right'] as const) {
      const ys = COLUMNS[side].map((id) => REGION_ANCHORS_3D[id].y);
      for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeLessThan(ys[i - 1]!);
    }
  });

  it('left-column anchors are on −X (astronaut’s right), right-column anchors on +X', () => {
    for (const id of COLUMNS.left) expect(REGION_ANCHORS_3D[id].x).toBeLessThan(0);
    for (const id of COLUMNS.right) expect(REGION_ANCHORS_3D[id].x).toBeGreaterThan(0);
  });

  it('the heart is on the astronaut’s left (+X), the kidneys at the back', () => {
    expect(REGION_ANCHORS_3D.heart.x).toBeGreaterThan(0);
    expect(REGION_ANCHORS_3D.kidneys.z).toBeLessThan(0);
  });

  it('anchors stay inside the figure', () => {
    for (const id of BODY_REGION_IDS) {
      const a = REGION_ANCHORS_3D[id];
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeLessThan(1.85);
      expect(Math.abs(a.x)).toBeLessThan(JOINTS.wrist.x + 0.05);
    }
  });
});

describe('focus views', () => {
  it('kidneys are seen from the back; the whole body uses the default view', () => {
    expect(Math.abs(FOCUS_VIEWS.kidneys.yaw)).toBeCloseTo(Math.PI);
    expect(FOCUS_VIEWS.whole_body).toMatchObject({ yaw: 0, span: 'fit' });
  });

  it('long regions (bones, muscles, blood) show the whole figure', () => {
    for (const id of ['bones', 'muscles', 'blood'] as const) {
      expect(FOCUS_VIEWS[id].span).toBe('fit');
    }
  });

  it('organ views zoom in to a span smaller than the figure', () => {
    for (const id of ['brain', 'eyes', 'heart', 'lungs', 'kidneys', 'immune'] as const) {
      const span = FOCUS_VIEWS[id].span;
      expect(typeof span === 'number' && span > 0 && span < 1).toBe(true);
    }
  });
});

/** Where a tap on a leader's end dot meets the suit (front surface, yaw 0), approximately. */
const SURFACE_UNDER_ANCHOR: Record<BodyRegionId, { x: number; y: number; z: number }> = {
  brain: { x: -0.04, y: 1.715, z: 0.175 },
  eyes: { x: 0.032, y: 1.645, z: 0.18 },
  heart: { x: 0.035, y: 1.29, z: 0.168 },
  lungs: { x: -0.09, y: 1.29, z: 0.168 },
  immune: { x: -0.17, y: 1.37, z: 0.13 },
  kidneys: { x: 0.075, y: 1.06, z: 0.14 },
  bones: { x: -0.12, y: 0.72, z: 0.095 },
  muscles: { x: 0.12, y: 0.72, z: 0.095 },
  blood: { x: 0.13, y: 0.32, z: 0.085 },
  whole_body: { x: -0.13, y: 0.1, z: 0.19 },
};

describe('pickRegion', () => {
  it('a tap where a leader ends selects that leader’s region', () => {
    for (const id of BODY_REGION_IDS) {
      expect(pickRegion(SURFACE_UNDER_ANCHOR[id], HIT_POINTS)).toBe(id);
    }
  });

  it('falls back to the whole body when nothing is close enough', () => {
    expect(pickRegion({ x: 5, y: 5, z: 5 }, HIT_POINTS)).toBe('whole_body');
    const lonely = { brain: [{ x: 0, y: 0, z: 0 }] } as unknown as Record<
      BodyRegionId,
      { x: number; y: number; z: number }[]
    >;
    expect(pickRegion({ x: PICK_DISTANCE + 0.01, y: 0, z: 0 }, lonely)).toBe('whole_body');
    expect(pickRegion({ x: PICK_DISTANCE - 0.01, y: 0, z: 0 }, lonely)).toBe('brain');
  });

  it('the backpack and the boots are the whole body', () => {
    expect(pickRegion({ x: 0, y: 1.3, z: -0.36 }, HIT_POINTS)).toBe('whole_body');
    expect(pickRegion({ x: 0.145, y: 0.08, z: 0.2 }, HIT_POINTS)).toBe('whole_body');
  });
});

const node = (
  userData: Record<string, unknown> = {},
  parent: SceneNode | null = null,
  visible = true,
): SceneNode => ({ visible, userData, parent });

describe('regionOfNode / regionOfHits', () => {
  const organs = node({});
  const heartGroup = node({ region: 'heart' }, organs);
  const heartMesh = node({}, heartGroup);
  const hiddenGroup = node({ region: 'lungs' }, organs, false);
  const hiddenMesh = node({}, hiddenGroup);
  const suitMesh = node({}, node({}));

  it('reads the nearest region tag and sees hidden ancestors', () => {
    expect(regionOfNode(heartMesh)).toEqual({ visible: true, region: 'heart' });
    expect(regionOfNode(hiddenMesh)).toEqual({ visible: false, region: null });
    expect(regionOfNode(suitMesh)).toEqual({ visible: true, region: null });
  });

  it('an organ behind the transparent suit wins over the suit', () => {
    const hits = [
      { object: suitMesh, point: { x: -0.12, y: 0.72, z: 0.095 } },
      { object: heartMesh, point: { x: 0.03, y: 1.3, z: 0.05 } },
    ];
    expect(regionOfHits(hits, HIT_POINTS, true)).toBe('heart');
    expect(regionOfHits(hits, HIT_POINTS, false)).toBe('bones');
  });

  it('hidden organs never catch a tap; a suit hit maps through the hit points', () => {
    const hits = [
      { object: hiddenMesh, point: { x: 0, y: 0, z: 0 } },
      { object: suitMesh, point: SURFACE_UNDER_ANCHOR.muscles },
    ];
    expect(regionOfHits(hits, HIT_POINTS, true)).toBe('muscles');
  });

  it('no visible hit = a tap beside the figure', () => {
    expect(regionOfHits([], HIT_POINTS, true)).toBeNull();
    expect(
      regionOfHits([{ object: hiddenMesh, point: { x: 0, y: 0, z: 0 } }], HIT_POINTS, true),
    ).toBeNull();
  });
});
