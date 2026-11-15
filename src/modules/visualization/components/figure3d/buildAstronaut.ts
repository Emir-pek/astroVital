import {
  type BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  BackSide,
  CylinderGeometry,
  Group,
  LatheGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { HELMET_RADIUS, JOINTS, REGION_ANCHORS_3D } from './anatomy';
import type { FigureColours } from './colours';
import type { Vec3 } from './orbit';
import {
  applySurface,
  createSurfaceTextures,
  type SurfaceLayer,
  type SurfaceOptions,
} from './surfaces';

/*
 * Procedural EVA suit + organs (spec 2026-11-15 §3.1). Builds a three.js scene graph only (no
 * renderer), so it runs in node/jsdom tests. Facing +Z, calm A-pose, proportions from JOINTS.
 *
 * Colour on the figure means health status only (ADR-036): organs take their region's status
 * colour; the suit is neutral (suit tokens) and is tinted only for the whole_body region.
 */

export type OrganRegionId = Exclude<BodyRegionId, 'whole_body'>;
export const ORGAN_REGIONS = BODY_REGION_IDS.filter(
  (id): id is OrganRegionId => id !== 'whole_body',
);

export interface Appearance {
  statuses: Record<BodyRegionId, DisplayStatus>;
  selected: BodyRegionId | null;
  colours: FigureColours;
}

export interface AstronautHandle {
  root: Group;
  suit: Group;
  organs: Group;
  suitMaterials: readonly Material[];
  organGroups: Record<OrganRegionId, Group>;
  organMaterials: Record<OrganRegionId, MeshStandardMaterial>;
  /** Leader anchors in figure space. */
  anchors: Record<BodyRegionId, Vector3>;
  setAppearance(appearance: Appearance): void;
  dispose(): void;
}

/** Opacity of the suit while an organ is selected (x-ray view). */
export const SUIT_XRAY_OPACITY = 0.14;
/** Opacity of alert organs glowing through the opaque suit. */
export const GHOST_OPACITY = 0.8;
/** Width of the dark keyline around x-ray ghosts (m, pushed out along the normals). */
export const GHOST_OUTLINE = 0.006;
/** Render order of ghost organs: after the suit, on top of it. */
export const GHOST_RENDER_ORDER = 10;
const SELECTED_EMISSIVE = 0.38;
const GHOST_EMISSIVE = 0.45;
const WHOLE_BODY_SELECTED_TINT = 0.5;
const WHOLE_BODY_ALERT_TINT = 0.22;

/**
 * Scene environment (image-based light) level. Kept low so the even light box does not flatten the
 * white suit; reflective materials scale it back up with envMapIntensity (`envFor`).
 */
export const ENV_INTENSITY = 0.1;
/** envMapIntensity that gives an effective environment level of `level`. */
const envFor = (level: number): number => level / ENV_INTENSITY;

const isAlert = (s: DisplayStatus): boolean =>
  s === 'advisory' || s === 'caution' || s === 'warning';

const UP = new Vector3(0, 1, 0);
const AXIS_Z = new Vector3(0, 0, 1);
const vec = (p: Vec3, sx = 1): Vector3 => new Vector3(p.x * sx, p.y, p.z);
const SIDES = [1, -1] as const;

export interface BuildOptions {
  /** Anisotropic filtering for the surface textures (renderer max, capped by the caller). */
  anisotropy?: number;
}

export function buildAstronaut(
  colours: FigureColours,
  options: BuildOptions = {},
): AstronautHandle {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const geo = <T extends BufferGeometry>(g: T): T => {
    geometries.add(g);
    return g;
  };

  // ---------------------------------------------------------------- materials
  const suitMaterials: Material[] = [];
  const suitMat = <T extends Material>(m: T): T => {
    materials.add(m);
    suitMaterials.push(m);
    return m;
  };
  // Procedural surface detail (surfaceData.ts): woven cloth, rubber grain, machined metal and a
  // soft large-scale layer, all neutral (luminance/roughness only — colour stays health status).
  const tex = createSurfaceTextures(options.anisotropy ?? 1);
  const textures: Texture[] = Object.values(tex);
  const layer = (
    map: Texture,
    scale: number,
    normal: number,
    roughness: number,
    tone: number,
  ): SurfaceLayer => ({ map, scale, normal, roughness, tone });
  /** Pressurised cloth: ripstop weave (4 cm tile) over soft puckering (45 cm tile). */
  const CLOTH: SurfaceOptions = {
    detail: layer(tex.weave, 25, 0.8, 0.06, 0.035),
    macro: layer(tex.macro, 2.2, 0.3, 0.05, 0.03),
  };
  const fabricProps = {
    roughness: 0.88,
    metalness: 0,
    sheen: 0.3,
    sheenRoughness: 0.65,
    sheenColor: new Color(colours.rim),
    specularIntensity: 0.4,
  };
  const fabric = suitMat(new MeshPhysicalMaterial({ color: colours.suitBase, ...fabricProps }));
  applySurface(fabric, CLOTH);
  const fabricHi = suitMat(new MeshPhysicalMaterial({ color: colours.suitHi, ...fabricProps }));
  applySurface(fabricHi, CLOTH);
  const shell = suitMat(
    new MeshPhysicalMaterial({
      color: colours.suitHi,
      roughness: 0.36,
      metalness: 0,
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
      specularIntensity: 0.6,
      envMapIntensity: envFor(0.26),
    }),
  );
  // Painted composite: a whisper of orange peel and uneven gloss.
  applySurface(shell, {
    detail: layer(tex.grain, 30, 0.03, 0.05, 0.01),
    macro: layer(tex.macro, 3, 0, 0.08, 0.015),
  });
  const pack = suitMat(
    new MeshPhysicalMaterial({ color: colours.suitMid, ...fabricProps, roughness: 0.82 }),
  );
  // Cloth cover over a rigid pack: the weave, but hardly any folds.
  applySurface(pack, { detail: CLOTH.detail, macro: { ...CLOTH.macro, normal: 0.08 } });
  /** Machined, anodised metal: fine streaks + anisotropic highlight along the part's U. */
  const metal = (color: string, roughness: number, metalness: number) => {
    const m = suitMat(
      new MeshPhysicalMaterial({
        color,
        roughness,
        metalness,
        anisotropy: 0.55,
        envMapIntensity: envFor(0.32),
      }),
    );
    applySurface(m, {
      detail: layer(tex.brushed, 30, 0.25, 0.08, 0.03),
      macro: layer(tex.macro, 4, 0, 0.06, 0.02),
    });
    return m;
  };
  const hardware = metal(colours.hw, 0.3, 0.85);
  const hardwareHi = metal(colours.hwHi, 0.24, 0.9);
  const hardwareDark = metal(colours.hwDark, 0.42, 0.6);
  const sole = suitMat(
    new MeshPhysicalMaterial({
      color: colours.sole,
      roughness: 0.9,
      metalness: 0,
      specularIntensity: 0.5,
    }),
  );
  applySurface(sole, {
    detail: layer(tex.grain, 60, 0.9, 0.06, 0.06),
    macro: layer(tex.macro, 4, 0.2, 0.04, 0.03),
  });
  const glove = suitMat(
    new MeshPhysicalMaterial({
      color: colours.suitMid,
      roughness: 0.74,
      metalness: 0,
      sheen: 0.4,
      sheenRoughness: 0.6,
      sheenColor: new Color(colours.rim),
      specularIntensity: 0.45,
    }),
  );
  applySurface(glove, {
    detail: layer(tex.grain, 45, 0.6, 0.06, 0.04),
    macro: layer(tex.macro, 5, 0.4, 0.04, 0.03),
  });
  const accent = suitMat(
    new MeshPhysicalMaterial({ color: colours.suitAccent, ...fabricProps, roughness: 0.7 }),
  );
  // Woven webbing stripe: a tighter weave.
  applySurface(accent, {
    detail: layer(tex.weave, 45, 0.8, 0.06, 0.04),
    macro: layer(tex.macro, 3, 0.2, 0.03, 0.02),
  });
  const visor = suitMat(
    new MeshPhysicalMaterial({
      color: colours.visor,
      roughness: 0.08,
      metalness: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: envFor(0.55),
    }),
  );
  // Faint wiping smudges and micro-scratches in the reflection (roughness only, no bumps).
  applySurface(visor, {
    detail: layer(tex.brushed, 18, 0, 0.03, 0),
    macro: layer(tex.macro, 6, 0, 0.06, 0),
  });
  const lens = suitMat(
    new MeshStandardMaterial({
      color: colours.lens,
      emissive: new Color(colours.sheen),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  const screen = suitMat(
    new MeshStandardMaterial({
      color: colours.lens,
      roughness: 0.15,
      metalness: 0.3,
      envMapIntensity: envFor(0.45),
    }),
  );
  /** Materials the whole_body tint applies to (the fabric and shells, not the hardware). */
  const tintable = [fabric, fabricHi, shell, pack, glove];
  /** Their own (neutral) colours, to blend the whole_body tint from. */
  const tintBase = tintable.map((m) => m.color.clone());

  const root = new Group();
  root.name = 'astronaut';
  const suit = new Group();
  suit.name = 'suit';
  const organs = new Group();
  organs.name = 'organs';
  root.add(suit, organs);

  const add = (parent: Object3D, g: BufferGeometry, m: Material, at?: Vector3): Mesh => {
    const mesh = new Mesh(g, m);
    if (at) mesh.position.copy(at);
    parent.add(mesh);
    return mesh;
  };

  /** Points a +Y-built mesh from `a` towards `b`; returns the length. */
  const orient = (obj: Object3D, a: Vector3, b: Vector3): number => {
    const d = b.clone().sub(a);
    const length = d.length();
    obj.position.copy(a);
    obj.quaternion.setFromUnitVectors(UP, d.normalize());
    return length;
  };

  /**
   * Pressurised fabric limb from `a` to `b`: a lathe with domed ends, tapering r0 → r1, with
   * soft bulges between the convolutes so it reads as an inflated suit, not a pipe.
   */
  const limb = (parent: Object3D, a: Vector3, b: Vector3, r0: number, r1: number, m: Material) => {
    const length = a.distanceTo(b);
    const pts: Vector2[] = [];
    const ends = 6;
    for (let k = 0; k <= ends; k++) {
      const t = -Math.PI / 2 + (k / ends) * (Math.PI / 2);
      pts.push(new Vector2(Math.max(1e-4, r0 * Math.cos(t)), r0 * 0.75 * Math.sin(t)));
    }
    const mid = 14;
    for (let k = 1; k < mid; k++) {
      const t = k / mid;
      const base = r0 + (r1 - r0) * t;
      const bulge = 1 + 0.045 * Math.sin(t * Math.PI * 3) ** 2;
      pts.push(new Vector2(base * bulge, t * length));
    }
    for (let k = 0; k <= ends; k++) {
      const t = (k / ends) * (Math.PI / 2);
      pts.push(new Vector2(Math.max(1e-4, r1 * Math.cos(t)), length + r1 * 0.75 * Math.sin(t)));
    }
    const mesh = new Mesh(geo(new LatheGeometry(pts, 32)), m);
    orient(mesh, a, b);
    parent.add(mesh);
    return mesh;
  };

  /** Thin ring (bearing, convolute, stripe) around the axis `dir` at `at`. */
  const ring = (
    parent: Object3D,
    at: Vector3,
    dir: Vector3,
    radius: number,
    tube: number,
    m: Material,
    zScale = 1,
  ) => {
    const mesh = new Mesh(geo(new TorusGeometry(radius, tube, 12, 40)), m);
    mesh.position.copy(at);
    mesh.quaternion.setFromUnitVectors(AXIS_Z, dir.clone().normalize());
    if (zScale !== 1) mesh.scale.set(1, zScale, 1);
    parent.add(mesh);
    return mesh;
  };

  const lathe = (profile: [number, number][], segments = 48) =>
    geo(
      new LatheGeometry(
        profile.map(([r, y]) => new Vector2(r, y)),
        segments,
      ),
    );

  // ---------------------------------------------------------------- torso
  // Hard upper torso: a lathe squashed front-to-back into an oval.
  const hut = add(
    suit,
    lathe([
      [0.165, 0.99],
      [0.182, 1.04],
      [0.206, 1.12],
      [0.228, 1.22],
      [0.245, 1.32],
      [0.252, 1.4],
      [0.243, 1.46],
      [0.214, 1.505],
      [0.17, 1.535],
      [0.112, 1.552],
      [1e-4, 1.558],
    ]),
    fabricHi,
  );
  hut.scale.set(1, 1, 0.7);

  // Lower torso ("brief").
  const brief = add(
    suit,
    lathe([
      [0.17, 1.03],
      [0.188, 0.98],
      [0.192, 0.93],
      [0.177, 0.87],
      [0.13, 0.83],
      [0.05, 0.812],
      [1e-4, 0.808],
    ]),
    fabric,
  );
  brief.scale.set(1, 1, 0.78);

  // Waist bearing: a polished double ring.
  ring(suit, new Vector3(0, 1.005, 0), UP, 0.176, 0.017, hardware, 0.76);
  ring(suit, new Vector3(0, 1.03, 0), UP, 0.17, 0.009, hardwareHi, 0.74);

  // Neck ring under the helmet.
  ring(suit, new Vector3(0, 1.528, 0.004), UP, 0.132, 0.022, hardware, 0.94);
  ring(suit, new Vector3(0, 1.55, 0.004), UP, 0.126, 0.01, hardwareHi, 0.94);

  // Display & control module on the chest, with a dark readout and two knobs.
  add(
    suit,
    geo(new RoundedBoxGeometry(0.22, 0.11, 0.08, 3, 0.022)),
    fabricHi,
    new Vector3(0, 1.2, 0.19),
  );
  add(
    suit,
    geo(new RoundedBoxGeometry(0.1, 0.038, 0.012, 2, 0.005)),
    screen,
    new Vector3(-0.02, 1.215, 0.23),
  );
  const knobGeo = geo(new CylinderGeometry(0.013, 0.013, 0.02, 20));
  knobGeo.rotateX(Math.PI / 2);
  add(suit, knobGeo, hardwareDark, new Vector3(0.065, 1.215, 0.232));
  add(suit, knobGeo, hardwareDark, new Vector3(0.065, 1.178, 0.232));
  add(
    suit,
    geo(new RoundedBoxGeometry(0.03, 0.012, 0.01, 1, 0.004)),
    accent,
    new Vector3(-0.065, 1.18, 0.23),
  );

  // Life-support backpack (PLSS) with a top module and side rails.
  add(
    suit,
    geo(new RoundedBoxGeometry(0.46, 0.56, 0.2, 4, 0.05)),
    pack,
    new Vector3(0, 1.25, -0.25),
  );
  add(
    suit,
    geo(new RoundedBoxGeometry(0.4, 0.09, 0.18, 3, 0.03)),
    fabricHi,
    new Vector3(0, 1.505, -0.25),
  );
  add(
    suit,
    geo(new RoundedBoxGeometry(0.36, 0.06, 0.03, 2, 0.012)),
    hardwareDark,
    new Vector3(0, 1.03, -0.355),
  );
  for (const s of SIDES) {
    add(
      suit,
      geo(new RoundedBoxGeometry(0.025, 0.42, 0.05, 2, 0.01)),
      hardwareDark,
      new Vector3(s * 0.235, 1.24, -0.25),
    );
  }

  // Hoses from the chest module round the flanks to the pack.
  for (const s of SIDES) {
    const curve = new CatmullRomCurve3([
      new Vector3(s * 0.1, 1.19, 0.21),
      new Vector3(s * 0.2, 1.12, 0.165),
      new Vector3(s * 0.26, 1.1, 0.03),
      new Vector3(s * 0.24, 1.14, -0.14),
    ]);
    add(suit, geo(new TubeGeometry(curve, 24, 0.012, 10, false)), hardware);
  }

  // ---------------------------------------------------------------- arms
  for (const s of SIDES) {
    const shoulder = vec(JOINTS.shoulder, s);
    const elbow = vec(JOINTS.elbow, s);
    const wrist = vec(JOINTS.wrist, s);
    const upperDir = elbow.clone().sub(shoulder).normalize();
    const lowerDir = wrist.clone().sub(elbow).normalize();

    // Shoulder: a domed cap over the bearing.
    const cap = add(
      suit,
      geo(new SphereGeometry(1, 28, 20)),
      fabricHi,
      shoulder.clone().add(new Vector3(-s * 0.01, 0.01, 0)),
    );
    cap.scale.set(0.094, 0.088, 0.092);
    ring(
      suit,
      shoulder.clone().add(upperDir.clone().multiplyScalar(0.05)),
      upperDir,
      0.083,
      0.014,
      hardware,
    );

    limb(
      suit,
      shoulder.clone().add(upperDir.clone().multiplyScalar(0.04)),
      elbow,
      0.079,
      0.068,
      fabric,
    );
    // Trim stripe on the upper arm.
    ring(suit, shoulder.clone().lerp(elbow, 0.42), upperDir, 0.082, 0.0075, accent);
    // Elbow convolute.
    const elbowJoint = add(suit, geo(new SphereGeometry(0.07, 24, 16)), fabric, elbow);
    elbowJoint.scale.set(1, 0.95, 1);
    ring(
      suit,
      elbow.clone().add(upperDir.clone().multiplyScalar(-0.02)),
      upperDir,
      0.072,
      0.009,
      fabricHi,
    );
    limb(suit, elbow, wrist, 0.066, 0.056, fabric);
    ring(
      suit,
      wrist.clone().add(lowerDir.clone().multiplyScalar(-0.012)),
      lowerDir,
      0.06,
      0.014,
      hardware,
    );

    // Glove: gauntlet, flattened palm, thumb on the front.
    const hand = new Group();
    orient(hand, wrist, wrist.clone().add(lowerDir));
    suit.add(hand);
    add(
      hand,
      geo(new CylinderGeometry(0.058, 0.055, 0.04, 24)),
      hardwareDark,
      new Vector3(0, 0.012, 0),
    );
    const palm = add(hand, geo(new SphereGeometry(1, 24, 18)), glove, new Vector3(0, 0.09, 0.004));
    palm.scale.set(0.042, 0.078, 0.056);
    const fingers = add(
      hand,
      geo(new SphereGeometry(1, 20, 14)),
      glove,
      new Vector3(-s * 0.006, 0.148, 0.01),
    );
    fingers.scale.set(0.037, 0.05, 0.05);
    const thumb = new Mesh(geo(new CapsuleGeometry(0.017, 0.045, 6, 12)), glove);
    thumb.position.set(-s * 0.008, 0.095, 0.054);
    thumb.rotation.set(0.45, 0, s * 0.35);
    hand.add(thumb);
  }

  // ---------------------------------------------------------------- legs
  for (const s of SIDES) {
    const hip = vec(JOINTS.hip, s);
    const knee = vec(JOINTS.knee, s);
    const ankle = vec(JOINTS.ankle, s);
    const thighDir = knee.clone().sub(hip).normalize();
    const shinDir = ankle.clone().sub(knee).normalize();

    limb(suit, hip.clone().add(new Vector3(0, 0.03, 0)), knee, 0.102, 0.085, fabric);
    ring(suit, hip.clone().lerp(knee, 0.3), thighDir, 0.103, 0.0075, accent);
    ring(suit, hip.clone().lerp(knee, 0.36), thighDir, 0.101, 0.0075, accent);
    const kneeJoint = add(
      suit,
      geo(new SphereGeometry(0.084, 24, 16)),
      fabricHi,
      knee.clone().add(new Vector3(0, 0, 0.008)),
    );
    kneeJoint.scale.set(1, 1.05, 1.05);
    ring(
      suit,
      knee.clone().add(shinDir.clone().multiplyScalar(0.04)),
      shinDir,
      0.083,
      0.01,
      fabricHi,
    );
    limb(suit, knee, ankle.clone().add(new Vector3(0, 0.06, 0)), 0.082, 0.07, fabric);

    // Boot: cuff, soft-edged shell, dark sole.
    add(
      suit,
      geo(new CylinderGeometry(0.079, 0.083, 0.1, 28)),
      fabricHi,
      new Vector3(ankle.x, 0.15, ankle.z),
    );
    ring(suit, new Vector3(ankle.x, 0.2, ankle.z), UP, 0.08, 0.011, hardware);
    add(
      suit,
      geo(new RoundedBoxGeometry(0.15, 0.12, 0.29, 4, 0.05)),
      fabricHi,
      new Vector3(ankle.x, 0.075, ankle.z + 0.04),
    );
    add(
      suit,
      geo(new RoundedBoxGeometry(0.158, 0.034, 0.302, 2, 0.013)),
      sole,
      new Vector3(ankle.x, 0.017, ankle.z + 0.04),
    );
  }

  // ---------------------------------------------------------------- helmet
  const helmetCentre = vec(JOINTS.helmet);
  add(suit, geo(new SphereGeometry(HELMET_RADIUS, 48, 32)), shell, helmetCentre);
  // Visor frame (a slightly larger white rim) and the dark reflective visor in front of it.
  const visorW = 2.3;
  add(
    suit,
    geo(
      new SphereGeometry(
        HELMET_RADIUS + 0.0035,
        48,
        24,
        Math.PI / 2 - (visorW + 0.24) / 2,
        visorW + 0.24,
        0.44,
        1.62,
      ),
    ),
    shell,
    helmetCentre,
  );
  add(
    suit,
    geo(
      new SphereGeometry(
        HELMET_RADIUS + 0.007,
        48,
        24,
        Math.PI / 2 - visorW / 2,
        visorW,
        0.54,
        1.42,
      ),
    ),
    visor,
    helmetCentre,
  );
  // Two slim helmet lights on the sides, lenses facing forward.
  const lampGeo = geo(new RoundedBoxGeometry(0.03, 0.036, 0.08, 2, 0.01));
  const lensGeo = geo(new CylinderGeometry(0.011, 0.011, 0.004, 20));
  lensGeo.rotateX(Math.PI / 2);
  for (const s of SIDES) {
    const at = new Vector3(s * (HELMET_RADIUS - 0.004), 1.735, 0.02);
    add(suit, lampGeo, hardwareHi, at);
    add(suit, lensGeo, lens, at.clone().add(new Vector3(0, 0, 0.041)));
  }

  // The suit shades itself (arms on the torso, helmet on the shoulders) under the key light;
  // organs never take part in shadowing.
  suit.traverse((o) => {
    if (o instanceof Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  // ---------------------------------------------------------------- organs
  const organGroups = {} as Record<OrganRegionId, Group>;
  const organMaterials = {} as Record<OrganRegionId, MeshStandardMaterial>;
  for (const id of ORGAN_REGIONS) {
    const g = new Group();
    g.name = `organ:${id}`;
    g.userData.region = id;
    g.visible = false;
    organs.add(g);
    organGroups[id] = g;
    // Organs keep the environment level they were designed under (0.45).
    const m = new MeshStandardMaterial({
      color: colours.status.none,
      roughness: 0.45,
      envMapIntensity: envFor(0.45),
    });
    materials.add(m);
    organMaterials[id] = m;
  }
  const unitSphere = geo(new SphereGeometry(1, 24, 18));
  const blob = (id: OrganRegionId, at: Vector3, scale: Vec3, rotZ = 0): Mesh => {
    const mesh = add(organGroups[id], unitSphere, organMaterials[id], at);
    mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.rotation.z = rotZ;
    return mesh;
  };
  const vessel = (id: OrganRegionId, points: Vector3[], radius: number) =>
    add(
      organGroups[id],
      geo(
        new TubeGeometry(
          new CatmullRomCurve3(points),
          Math.max(16, points.length * 10),
          radius,
          8,
          false,
        ),
      ),
      organMaterials[id],
    );
  const bone = (id: OrganRegionId, a: Vector3, b: Vector3, r: number) => {
    const length = a.distanceTo(b);
    const mesh = new Mesh(
      geo(new CapsuleGeometry(r, Math.max(0.001, length - 2 * r), 4, 10)),
      organMaterials[id],
    );
    orient(mesh, a, b);
    mesh.position.lerpVectors(a, b, 0.5);
    organGroups[id].add(mesh);
    return mesh;
  };
  const p = (x: number, y: number, z: number) => new Vector3(x, y, z);

  // Brain: two folded hemispheres (a unit sphere with radial ripples for the gyri), the
  // cerebellum tucked under the back, a thin brain stem.
  const folded = geo(new SphereGeometry(1, 64, 48));
  const pos = folded.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ripple =
        1 +
        0.028 * Math.sin(19 * x + 7 * z) * Math.sin(21 * y - 5 * x) +
        0.02 * Math.sin(13 * z + 17 * y) +
        0.012 * Math.sin(31 * x - 23 * y + 29 * z);
      pos.setXYZ(i, x * ripple, y * ripple, z * ripple);
    }
    folded.computeVertexNormals();
  }
  for (const s of SIDES) {
    const hemi = add(organGroups.brain, folded, organMaterials.brain, p(s * 0.025, 1.706, 0.004));
    hemi.scale.set(0.046, 0.054, 0.072);
    hemi.rotation.z = s * 0.06;
  }
  const cerebellum = add(organGroups.brain, folded, organMaterials.brain, p(0, 1.66, -0.05));
  cerebellum.scale.set(0.04, 0.022, 0.028);
  bone('brain', p(0, 1.66, -0.025), p(0, 1.605, -0.028), 0.0085);

  // Eyes behind the visor.
  for (const s of SIDES)
    blob('eyes', p(s * 0.032, 1.655, 0.078), { x: 0.0135, y: 0.0135, z: 0.0135 });

  // Heart: apex tilted down towards the astronaut's left; two ventricles, two atria, the aortic
  // arch curving back over the top and the pulmonary trunk.
  blob('heart', p(0.035, 1.285, 0.045), { x: 0.05, y: 0.066, z: 0.046 }, 0.55);
  blob('heart', p(0.0, 1.295, 0.062), { x: 0.04, y: 0.052, z: 0.034 }, 0.35);
  blob('heart', p(-0.012, 1.33, 0.035), { x: 0.032, y: 0.03, z: 0.03 });
  blob('heart', p(0.035, 1.335, 0.02), { x: 0.028, y: 0.026, z: 0.028 });
  // Aortic arch: up only a little, then curving back over the top; short pulmonary trunk.
  vessel(
    'heart',
    [
      p(0.008, 1.33, 0.045),
      p(0.002, 1.362, 0.036),
      p(-0.01, 1.378, 0.004),
      p(-0.017, 1.362, -0.032),
      p(-0.015, 1.32, -0.05),
    ],
    0.014,
  );
  vessel('heart', [p(0.022, 1.335, 0.062), p(0.03, 1.352, 0.05), p(0.045, 1.36, 0.03)], 0.011);

  // Lungs: the left one smaller (room for the heart), trachea and bronchi.
  blob('lungs', p(-0.092, 1.31, 0), { x: 0.072, y: 0.115, z: 0.07 });
  blob('lungs', p(0.1, 1.315, -0.005), { x: 0.062, y: 0.11, z: 0.068 });
  vessel('lungs', [p(0, 1.5, 0.015), p(0, 1.44, 0.01), p(0, 1.405, 0.005)], 0.011);
  for (const s of SIDES)
    vessel('lungs', [p(0, 1.405, 0.005), p(s * 0.035, 1.385, 0), p(s * 0.07, 1.36, 0)], 0.008);

  // Kidneys at the lower back, ureters.
  for (const s of SIDES) {
    blob('kidneys', p(s * 0.075, 1.07, -0.06), { x: 0.028, y: 0.052, z: 0.024 }, s * 0.22);
    vessel(
      'kidneys',
      [p(s * 0.065, 1.03, -0.05), p(s * 0.05, 0.96, -0.03), p(s * 0.03, 0.9, 0)],
      0.004,
    );
  }

  // Bones: spine, ribs + sternum, pelvis, clavicles, long bones.
  const vertebraGeo = geo(new CylinderGeometry(0.016, 0.016, 0.026, 12));
  for (let i = 0; i < 15; i++) {
    add(
      organGroups.bones,
      vertebraGeo,
      organMaterials.bones,
      p(0, 0.97 + i * 0.037, -0.075 + 0.012 * Math.sin((i / 14) * Math.PI)),
    );
  }
  const ribGap = 0.55;
  const ribRadii = [0.088, 0.108, 0.12, 0.126, 0.126, 0.12];
  ribRadii.forEach((r, i) => {
    const g = geo(new TorusGeometry(r, 0.0065, 6, 40, Math.PI * 2 - ribGap));
    g.rotateX(Math.PI / 2);
    g.rotateY((3 * Math.PI) / 2 - ribGap / 2);
    const mesh = add(organGroups.bones, g, organMaterials.bones, p(0, 1.42 - i * 0.045, -0.01));
    mesh.scale.set(1, 1, 0.7);
  });
  add(
    organGroups.bones,
    geo(new RoundedBoxGeometry(0.028, 0.17, 0.012, 2, 0.005)),
    organMaterials.bones,
    p(0, 1.33, 0.083),
  );
  const pelvis = add(
    organGroups.bones,
    geo(new TorusGeometry(0.092, 0.02, 10, 36)),
    organMaterials.bones,
    p(0, 0.95, -0.005),
  );
  pelvis.rotation.x = Math.PI / 2 - 0.35;
  pelvis.scale.set(1, 0.72, 1);
  for (const s of SIDES) {
    const shoulder = vec(JOINTS.shoulder, s);
    const elbow = vec(JOINTS.elbow, s);
    const wrist = vec(JOINTS.wrist, s);
    const hip = vec(JOINTS.hip, s);
    const knee = vec(JOINTS.knee, s);
    const ankle = vec(JOINTS.ankle, s);
    bone('bones', p(s * 0.02, 1.47, 0.06), p(s * 0.205, 1.49, 0), 0.009);
    bone('bones', shoulder, elbow, 0.013);
    bone('bones', elbow, wrist.clone().add(p(s * 0.008, 0, 0)), 0.009);
    bone(
      'bones',
      elbow.clone().add(p(-s * 0.008, 0, 0.01)),
      wrist.clone().add(p(-s * 0.006, 0, 0.012)),
      0.008,
    );
    bone('bones', hip, knee, 0.017);
    bone('bones', knee, ankle.clone().add(p(0, 0.04, 0)), 0.014);
    blob('bones', knee.clone().add(p(0, 0, 0.04)), { x: 0.022, y: 0.024, z: 0.012 });
  }

  // Muscles: pectorals, deltoids, biceps, quadriceps, calves.
  for (const s of SIDES) {
    const shoulder = vec(JOINTS.shoulder, s);
    const elbow = vec(JOINTS.elbow, s);
    const hip = vec(JOINTS.hip, s);
    const knee = vec(JOINTS.knee, s);
    const ankle = vec(JOINTS.ankle, s);
    blob('muscles', p(s * 0.075, 1.37, 0.088), { x: 0.07, y: 0.048, z: 0.026 }, s * 0.18);
    blob('muscles', shoulder.clone().add(p(s * 0.01, 0, 0.005)), { x: 0.05, y: 0.055, z: 0.05 });
    const biceps = blob(
      'muscles',
      shoulder
        .clone()
        .lerp(elbow, 0.55)
        .add(p(0, 0, 0.022)),
      { x: 0.033, y: 0.075, z: 0.032 },
    );
    biceps.quaternion.setFromUnitVectors(UP, elbow.clone().sub(shoulder).normalize());
    const quad = blob(
      'muscles',
      hip
        .clone()
        .lerp(knee, 0.48)
        .add(p(0, 0, 0.035)),
      { x: 0.052, y: 0.15, z: 0.045 },
    );
    quad.quaternion.setFromUnitVectors(UP, knee.clone().sub(hip).normalize());
    const calf = blob(
      'muscles',
      knee
        .clone()
        .lerp(ankle, 0.32)
        .add(p(0, 0, -0.03)),
      { x: 0.04, y: 0.1, z: 0.04 },
    );
    calf.quaternion.setFromUnitVectors(UP, ankle.clone().sub(knee).normalize());
  }

  // Blood: aorta down to the pelvis, iliac/femoral to both ankles, subclavian to both wrists,
  // carotids up the neck.
  const arch = p(0, 1.39, 0.015);
  const bifurcation = p(0, 0.97, -0.03);
  vessel(
    'blood',
    [
      p(0.012, 1.33, 0.04),
      arch,
      p(-0.02, 1.36, -0.04),
      p(-0.012, 1.25, -0.05),
      p(-0.005, 1.05, -0.045),
      bifurcation,
    ],
    0.0085,
  );
  for (const s of SIDES) {
    const elbow = vec(JOINTS.elbow, s);
    const wrist = vec(JOINTS.wrist, s);
    vessel(
      'blood',
      [
        bifurcation,
        p(s * 0.06, 0.93, 0),
        p(s * 0.105, 0.86, 0.025),
        p(s * 0.12, 0.65, 0.03),
        p(s * 0.128, 0.52, 0),
        p(s * 0.132, 0.35, 0.025),
        p(s * 0.14, 0.15, 0.02),
      ],
      0.0075,
    );
    vessel(
      'blood',
      [
        arch,
        p(s * 0.1, 1.44, 0.02),
        p(s * 0.25, 1.43, 0),
        elbow.clone().add(p(0, 0, 0.02)),
        wrist.clone().add(p(0, 0, 0.012)),
      ],
      0.0065,
    );
    vessel(
      'blood',
      [p(s * 0.008, 1.39, 0.02), p(s * 0.03, 1.5, 0.02), p(s * 0.035, 1.62, 0)],
      0.006,
    );
  }

  // Immune: lymph nodes (neck, armpits, groin), spleen, thymus.
  for (const s of SIDES) {
    for (const at of [
      p(s * 0.045, 1.5, 0.03),
      p(s * 0.05, 1.47, 0),
      p(s * 0.17, 1.38, 0.02),
      p(s * 0.165, 1.34, -0.01),
      p(s * 0.085, 0.9, 0.06),
      p(s * 0.07, 0.875, 0.05),
    ]) {
      blob('immune', at, { x: 0.013, y: 0.013, z: 0.013 });
    }
  }
  blob('immune', p(0.13, 1.16, -0.03), { x: 0.03, y: 0.05, z: 0.022 }, -0.3);
  blob('immune', p(0, 1.42, 0.065), { x: 0.03, y: 0.035, z: 0.015 });

  // Dark keyline around the x-ray ghosts: an inverted hull pushed out along the normals in view
  // space (so scaled blobs get the same width), drawn just before each ghost. It keeps a pastel
  // status colour readable on the white suit — the 3D twin of the SVG figure's keyline.
  const outlineMaterial = new MeshBasicMaterial({
    color: colours.bg,
    side: BackSide,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  outlineMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      [
        '#include <project_vertex>',
        `mvPosition.xyz += normalize(normalMatrix * normal) * ${GHOST_OUTLINE.toFixed(4)};`,
        'gl_Position = projectionMatrix * mvPosition;',
      ].join('\n'),
    );
  };
  materials.add(outlineMaterial);
  const outlines: Mesh[] = [];
  for (const id of ORGAN_REGIONS) {
    for (const child of [...organGroups[id].children]) {
      if (!(child instanceof Mesh)) continue;
      const outline = new Mesh(child.geometry, outlineMaterial);
      outline.position.copy(child.position);
      outline.quaternion.copy(child.quaternion);
      outline.scale.copy(child.scale);
      outline.userData.outline = true;
      organGroups[id].add(outline);
      outlines.push(outline);
    }
  }

  const anchors = Object.fromEntries(
    BODY_REGION_IDS.map((id) => [id, vec(REGION_ANCHORS_3D[id])]),
  ) as Record<BodyRegionId, Vector3>;

  // ---------------------------------------------------------------- appearance
  const black = new Color(0, 0, 0);
  const setSuitOpacity = (opacity: number) => {
    const transparent = opacity < 1;
    for (const m of suitMaterials) {
      if (m.transparent !== transparent) m.needsUpdate = true;
      m.transparent = transparent;
      m.opacity = opacity;
      m.depthWrite = !transparent;
    }
  };

  function setAppearance({ statuses, selected, colours: c }: Appearance): void {
    const colourOf = (s: DisplayStatus) => c.status[s];
    const selectedOrgan: OrganRegionId | null =
      selected !== null && selected !== 'whole_body' ? selected : null;

    setSuitOpacity(selectedOrgan ? SUIT_XRAY_OPACITY : 1);

    // Whole-body tint: strong while selected, faint while it is in alert and nothing is selected.
    const wb = statuses.whole_body;
    let tint: string | null = null;
    let tintIntensity = 0;
    if (selected === 'whole_body') {
      tint = wb === 'nominal' || wb === 'none' ? c.accent : colourOf(wb);
      tintIntensity = WHOLE_BODY_SELECTED_TINT;
    } else if (selected === null && isAlert(wb)) {
      tint = colourOf(wb);
      tintIntensity = WHOLE_BODY_ALERT_TINT;
    }
    // On a white suit an emissive glow alone saturates to white, so the tint also moves the
    // fabric colour itself part of the way towards the status colour.
    const tintColour = tint ? new Color(tint) : null;
    tintable.forEach((m, i) => {
      const base = tintBase[i] ?? m.color;
      m.color.copy(base);
      if (tintColour) {
        m.color.lerp(tintColour, tintIntensity);
        m.emissive.copy(tintColour);
      } else {
        m.emissive.copy(black);
      }
      m.emissiveIntensity = tintColour ? tintIntensity * 0.4 : 0;
    });

    for (const id of ORGAN_REGIONS) {
      const group = organGroups[id];
      const m = organMaterials[id];
      const colour = colourOf(statuses[id]);
      m.color.set(colour);
      m.emissive.set(colour);
      // Ghosts only while nothing is selected; a selected organ alone, solid; while the whole
      // body is selected the suit carries the colour and no organ shows.
      const ghost = selectedOrgan === null;
      group.visible = ghost ? selected === null && isAlert(statuses[id]) : id === selectedOrgan;
      if (m.transparent !== ghost) m.needsUpdate = true;
      m.transparent = ghost;
      m.opacity = ghost ? GHOST_OPACITY : 1;
      m.depthTest = !ghost;
      m.depthWrite = !ghost;
      // Ghosts show the exact token colour (no tone mapping), so caution yellow stays yellow.
      if (m.toneMapped !== !ghost) m.needsUpdate = true;
      m.toneMapped = !ghost;
      m.emissiveIntensity = ghost ? GHOST_EMISSIVE : SELECTED_EMISSIVE;
      const order = ghost ? GHOST_RENDER_ORDER : 0;
      group.renderOrder = order;
      group.traverse((o) => {
        o.renderOrder = o.userData.outline === true ? order - 1 : order;
      });
    }
    for (const o of outlines) o.visible = selectedOrgan === null;
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    textures.length = 0;
    geometries.clear();
    materials.clear();
    root.clear();
  }

  return {
    root,
    suit,
    organs,
    suitMaterials,
    organGroups,
    organMaterials,
    anchors,
    setAppearance,
    dispose,
  };
}
