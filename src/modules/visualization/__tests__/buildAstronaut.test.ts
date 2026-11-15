import { Box3, BufferGeometry, Mesh, type Object3D } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import {
  GHOST_OPACITY,
  GHOST_RENDER_ORDER,
  ORGAN_REGIONS,
  SUIT_XRAY_OPACITY,
  buildAstronaut,
  type AstronautHandle,
} from '../components/figure3d/buildAstronaut';
import { readFigureColours } from '../components/figure3d/colours';

const colours = readFigureColours();
const allNominal = (): Record<BodyRegionId, DisplayStatus> =>
  Object.fromEntries(BODY_REGION_IDS.map((id) => [id, 'nominal'])) as Record<
    BodyRegionId,
    DisplayStatus
  >;
const hex = (c: { getHexString: () => string }) => `#${c.getHexString()}`;

let handle: AstronautHandle | null = null;
const build = () => {
  handle = buildAstronaut(colours);
  return handle;
};
afterEach(() => {
  handle?.dispose();
  handle = null;
});

const meshesOf = (o: Object3D): Mesh[] => {
  const out: Mesh[] = [];
  o.traverse((n) => {
    if (n instanceof Mesh) out.push(n);
  });
  return out;
};

describe('buildAstronaut: scene graph', () => {
  it('builds a suit and one non-empty, tagged organ group per inner region', () => {
    const a = build();
    expect(meshesOf(a.suit).length).toBeGreaterThan(40);
    expect(ORGAN_REGIONS).not.toContain('whole_body');
    expect(ORGAN_REGIONS).toHaveLength(BODY_REGION_IDS.length - 1);
    for (const id of ORGAN_REGIONS) {
      const g = a.organGroups[id];
      expect(g.userData.region).toBe(id);
      expect(meshesOf(g).length).toBeGreaterThan(0);
    }
  });

  it('organs sit inside the suit’s bounds', () => {
    const a = build();
    a.root.updateMatrixWorld(true);
    const suit = new Box3().setFromObject(a.suit);
    for (const id of ORGAN_REGIONS) {
      const g = a.organGroups[id];
      g.visible = true;
      const box = new Box3().setFromObject(g);
      expect(box.isEmpty()).toBe(false);
      expect(suit.containsBox(box)).toBe(true);
    }
  });

  it('exposes every region anchor', () => {
    const a = build();
    for (const id of BODY_REGION_IDS) expect(a.anchors[id]).toBeDefined();
  });

  it('dispose frees every geometry and empties the graph', () => {
    const a = buildAstronaut(colours);
    const spy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const geometries = new Set<BufferGeometry>();
    a.root.traverse((n) => {
      if (n instanceof Mesh) geometries.add(n.geometry as BufferGeometry);
    });
    a.dispose();
    expect(spy.mock.instances.length).toBeGreaterThanOrEqual(geometries.size);
    for (const g of geometries) expect(spy.mock.instances).toContain(g);
    expect(a.root.children).toHaveLength(0);
  });
});

describe('buildAstronaut: appearance (colour = health status only)', () => {
  it('nothing selected, all nominal: suit opaque, every organ hidden', () => {
    const a = build();
    a.setAppearance({ statuses: allNominal(), selected: null, colours });
    for (const m of a.suitMaterials) {
      expect(m.opacity).toBe(1);
      expect(m.transparent).toBe(false);
    }
    for (const id of ORGAN_REGIONS) expect(a.organGroups[id].visible).toBe(false);
  });

  it('nothing selected: alert organs glow through the suit as x-ray ghosts in their status colour', () => {
    const a = build();
    const statuses = {
      ...allNominal(),
      lungs: 'caution',
      kidneys: 'warning',
      eyes: 'stale',
    } as const;
    a.setAppearance({ statuses, selected: null, colours });
    for (const id of ['lungs', 'kidneys'] as const) {
      const m = a.organMaterials[id];
      expect(a.organGroups[id].visible).toBe(true);
      expect(m.transparent).toBe(true);
      expect(m.opacity).toBe(GHOST_OPACITY);
      expect(m.depthTest).toBe(false);
      expect(a.organGroups[id].renderOrder).toBe(GHOST_RENDER_ORDER);
    }
    expect(hex(a.organMaterials.lungs.color)).toBe(colours.status.caution);
    expect(hex(a.organMaterials.kidneys.emissive)).toBe(colours.status.warning);
    // Stale is not an alert: hidden.
    expect(a.organGroups.eyes.visible).toBe(false);
  });

  it('organ selected: suit turns transparent, only that organ shows, solid, in its status colour', () => {
    const a = build();
    a.setAppearance({
      statuses: { ...allNominal(), lungs: 'caution' },
      selected: 'heart',
      colours,
    });
    for (const m of a.suitMaterials) {
      expect(m.opacity).toBe(SUIT_XRAY_OPACITY);
      expect(m.transparent).toBe(true);
      expect(m.depthWrite).toBe(false);
    }
    expect(a.organGroups.heart.visible).toBe(true);
    expect(a.organMaterials.heart.transparent).toBe(false);
    expect(a.organMaterials.heart.depthTest).toBe(true);
    expect(hex(a.organMaterials.heart.color)).toBe(colours.status.nominal);
    // Other organs — also the alert lungs — are hidden while another region is selected.
    expect(a.organGroups.lungs.visible).toBe(false);
  });

  it('stale and no-data organs use the neutral text-3 colour', () => {
    const a = build();
    a.setAppearance({ statuses: { ...allNominal(), eyes: 'none' }, selected: 'eyes', colours });
    expect(hex(a.organMaterials.eyes.color)).toBe(colours.status.none);
  });

  it('the selected organ follows a status change while it stays selected', () => {
    const a = build();
    a.setAppearance({ statuses: allNominal(), selected: 'kidneys', colours });
    a.setAppearance({
      statuses: { ...allNominal(), kidneys: 'warning' },
      selected: 'kidneys',
      colours,
    });
    expect(hex(a.organMaterials.kidneys.color)).toBe(colours.status.warning);
  });

  it('whole body selected: suit stays opaque and is tinted (accent while nominal, status colour in alert)', () => {
    const a = build();
    a.setAppearance({ statuses: allNominal(), selected: 'whole_body', colours });
    const fabric = a.suitMaterials[0] as unknown as {
      emissive: { getHexString: () => string };
      emissiveIntensity: number;
      opacity: number;
    };
    expect(fabric.opacity).toBe(1);
    expect(hex(fabric.emissive)).toBe(colours.accent);
    expect(fabric.emissiveIntensity).toBeGreaterThan(0);
    a.setAppearance({
      statuses: { ...allNominal(), whole_body: 'caution' },
      selected: 'whole_body',
      colours,
    });
    expect(hex(fabric.emissive)).toBe(colours.status.caution);
    for (const id of ORGAN_REGIONS) expect(a.organGroups[id].visible).toBe(false);
  });

  it('whole body in alert with nothing selected: a faint tint; back to none when nominal', () => {
    const a = build();
    const fabric = a.suitMaterials[0] as unknown as { emissiveIntensity: number };
    a.setAppearance({
      statuses: { ...allNominal(), whole_body: 'warning' },
      selected: null,
      colours,
    });
    const faint = fabric.emissiveIntensity;
    expect(faint).toBeGreaterThan(0);
    a.setAppearance({
      statuses: { ...allNominal(), whole_body: 'warning' },
      selected: 'whole_body',
      colours,
    });
    expect(fabric.emissiveIntensity).toBeGreaterThan(faint);
    a.setAppearance({ statuses: allNominal(), selected: null, colours });
    expect(fabric.emissiveIntensity).toBe(0);
  });
});

describe('readFigureColours', () => {
  it('reads tokens and falls back to the tokens.css values', () => {
    const read = (name: string, fallback: string) =>
      name === '--av-suit-accent' ? '#123456' : fallback;
    const c = readFigureColours(read);
    expect(c.suitAccent).toBe('#123456');
    expect(c.status.warning).toBe('#ff8f99');
    expect(c.status.stale).toBe(c.status.none);
  });
});
