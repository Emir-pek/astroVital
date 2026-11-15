import {
  ACESFilmicToneMapping,
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { FOCUS_VIEWS, HIT_POINTS, REGION_ANCHORS_3D } from './anatomy';
import { ENV_INTENSITY, buildAstronaut } from './buildAstronaut';
import { readFigureColours } from './colours';
import {
  IDLE,
  pointerCancel,
  pointerDown,
  pointerMove,
  pointerUp,
  type GestureEffect,
  type GestureState,
} from './gesture';
import {
  DEFAULT_TARGET,
  FALLBACK_DISTANCE,
  applyDrag,
  clampView,
  defaultDistance,
  distanceFor,
  dragVelocityToYawRate,
  easeInOutCubic,
  isBehind,
  isDefaultView,
  lerpView,
  rotateBy,
  stepInertia,
  worldTarget,
  zoomBy,
  zoomLimits,
  type View,
} from './orbit';
import { regionOfHits } from './pick';
import type { BehindMap, FitBox, Projection } from './stageTypes';

/*
 * Imperative three.js stage behind AstronautStage (spec 2026-11-15 §3.1): renderer, lights, the
 * astronaut, gestures and an ON-DEMAND render loop — a frame is drawn only while a tween or
 * inertia runs, or after something changed (invalidate). Idle = no rAF at all.
 */

export const FOV = 30;
/** Camera move to a region / back to the whole figure (ms). */
export const FOCUS_MS = 600;
const STEP_MS = 280;
/** Keyboard turn per arrow press (30°). */
const KEY_TURN = Math.PI / 6;
/** Fastest spin a fling may start (rad/s). */
const MAX_SPIN = Math.PI * 4;
/** Room kept free above (status tag) and below the figure inside its box (px). */
const HUD_TOP = 44;
const HUD_BOTTOM = 8;

export interface StageCallbacks {
  onSelect: (id: BodyRegionId) => void;
  onBackgroundTap: () => void;
  onProject: (points: Projection, behind: BehindMap) => void;
  onContextLost: () => void;
  /** The view left / returned to the default (whole figure, facing the viewer). */
  onOffDefaultChange: (offDefault: boolean) => void;
}

export interface StageInit {
  statuses: Record<BodyRegionId, DisplayStatus>;
  selected: BodyRegionId | null;
  fit: FitBox;
  reducedMotion: boolean;
}

export interface StageEngine {
  setStatuses: (statuses: Record<BodyRegionId, DisplayStatus>) => void;
  setSelected: (selected: BodyRegionId | null) => void;
  setFit: (fit: FitBox) => void;
  setReducedMotion: (reduced: boolean) => void;
  /** Keyboard: turn by ±30°. */
  turn: (direction: 1 | -1) => void;
  /** Keyboard: zoom by a factor (> 1 = closer). */
  zoom: (factor: number) => void;
  /** Back to the current goal: the selected region's view, or the whole figure. */
  reset: () => void;
  dispose: () => void;
}

interface Tween {
  from: View;
  /** Fixed end view, or null = the goal view (re-evaluated every frame, so a resize retargets). */
  to: View | null;
  start: number;
  duration: number;
}

/** Soft contact shadow: radial gradient on a canvas texture. Null where 2D canvas is missing. */
function contactShadow(colour: string): Mesh | null {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  const geometry = new PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.85 }),
  );
  mesh.scale.set(0.95, 1, 0.62);
  mesh.position.y = 0.001;
  mesh.renderOrder = -1;
  return mesh;
}

export function createStage(
  host: HTMLElement,
  init: StageInit,
  callbacks: () => StageCallbacks,
): StageEngine {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  host.appendChild(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  // One soft shadow map (key light only): the suit shades itself — arms on the torso, helmet on
  // the shoulders. Redrawn only with a frame (rendering is on demand).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const colours = readFigureColours();
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  // The room is a bright, even light box: as ambient it flattens the white suit, so it stays low
  // here and the reflective materials (metal, visor, helmet) raise it per material — reflections
  // without washing out the modelling (ENV_INTENSITY, buildAstronaut).
  scene.environmentIntensity = ENV_INTENSITY;
  room.dispose();
  pmrem.dispose();

  // Lights stay put while the figure turns: sky/ground fill (lit tops, darker undersides), a
  // three-quarter key from upper left front that casts the only shadow, a weak front-right fill
  // and cool rims from behind that separate the silhouette from the dark background.
  const hemi = new HemisphereLight(colours.rim, colours.ground, 0.35);
  const key = new DirectionalLight(colours.sheen, 3.6);
  key.position.set(-3.0, 3.4, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  const shadowCam = key.shadow.camera;
  shadowCam.left = -1.3;
  shadowCam.right = 1.3;
  shadowCam.top = 1.6;
  shadowCam.bottom = -1.6;
  shadowCam.near = 1;
  shadowCam.far = 9;
  shadowCam.updateProjectionMatrix();
  const fill = new DirectionalLight(colours.rim, 0.5);
  fill.position.set(3.0, 0.8, 2.6);
  const rim = new DirectionalLight(colours.rim, 2.2);
  rim.position.set(2.6, 2.4, -3.2);
  const rimLeft = new DirectionalLight(colours.rim, 0.8);
  rimLeft.position.set(-2.8, 1.6, -2.6);
  scene.add(hemi, key, fill, rim, rimLeft);

  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);
  const astronaut = buildAstronaut(colours, {
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
  });
  scene.add(astronaut.root);
  const shadow = contactShadow(colours.ground);
  if (shadow) scene.add(shadow);

  // ------------------------------------------------------------------ state
  let statuses = init.statuses;
  let selected = init.selected;
  let fit = init.fit;
  let reduced = init.reducedMotion;
  let size = { width: 0, height: 0 };
  let defaultView: View = { yaw: 0, target: DEFAULT_TARGET, distance: FALLBACK_DISTANCE };
  let view: View = defaultView;
  /** The view equals the goal view (the user has not turned or zoomed since it got there). */
  let atGoal = true;
  let tween: Tween | null = null;
  let velocity = 0;
  let gesture: GestureState = IDLE;
  let raf = 0;
  let lastFrame = 0;
  let offDefault = false;
  let disposed = false;

  const figureFit = (): FitBox => ({
    width: Math.max(1, fit.width),
    height: Math.max(1, fit.height - HUD_TOP - HUD_BOTTOM),
  });

  /** Where the camera should be for the current selection. */
  const goalView = (): View => {
    if (selected === null) return defaultView;
    const focus = FOCUS_VIEWS[selected];
    const limits = zoomLimits(defaultView.distance);
    const distance =
      focus.span === 'fit'
        ? defaultView.distance
        : Math.min(
            defaultView.distance,
            Math.max(limits.min, distanceFor(FOV, size.height, focus.span, figureFit().width)),
          );
    return { yaw: focus.yaw, target: focus.target, distance: distance || defaultView.distance };
  };

  const applyAppearance = () => astronaut.setAppearance({ statuses, selected, colours });

  // ------------------------------------------------------------------ rendering
  const tmp = new Vector3();
  const project = () => {
    const points = {} as Projection;
    const behind = {} as BehindMap;
    for (const id of BODY_REGION_IDS) {
      tmp.copy(astronaut.anchors[id]).applyMatrix4(astronaut.root.matrixWorld).project(camera);
      points[id] = {
        x: ((tmp.x + 1) / 2) * size.width,
        y: ((1 - tmp.y) / 2) * size.height,
        inFront: tmp.z > -1 && tmp.z < 1,
      };
      behind[id] = isBehind(REGION_ANCHORS_3D[id], view.yaw);
    }
    callbacks().onProject(points, behind);
  };

  const updateOffDefault = () => {
    const settled = tween
      ? tween.to === null && selected === null
      : selected === null && isDefaultView(view, defaultView);
    const off = !settled;
    if (off !== offDefault) {
      offDefault = off;
      callbacks().onOffDefaultChange(off);
    }
  };

  const render = () => {
    if (size.width <= 0 || size.height <= 0) return;
    astronaut.root.rotation.y = view.yaw;
    astronaut.root.updateMatrixWorld(true);
    const wt = worldTarget(view);
    camera.position.set(wt.x, wt.y, wt.z + view.distance);
    camera.lookAt(wt.x, wt.y, wt.z);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    project();
    updateOffDefault();
  };

  const frame = (time: number) => {
    raf = 0;
    if (disposed) return;
    const dt = lastFrame ? (time - lastFrame) / 1000 : 1 / 60;
    lastFrame = time;
    let active = false;
    if (tween) {
      const k = (time - tween.start) / tween.duration;
      const to = tween.to ?? goalView();
      if (k >= 1) {
        view = to;
        atGoal = tween.to === null;
        tween = null;
      } else {
        view = lerpView(tween.from, to, easeInOutCubic(k));
        active = true;
      }
    } else if (velocity !== 0) {
      const step = stepInertia(velocity, dt);
      view = rotateBy(view, step.delta);
      velocity = step.velocity;
      active = velocity !== 0;
    }
    render();
    if (active) invalidate();
    else lastFrame = 0;
  };

  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }

  /** Animate to `to` (null = the goal view); instant with reduced motion. */
  const startTween = (to: View | null, duration: number) => {
    velocity = 0;
    if (reduced || duration <= 0) {
      tween = null;
      view = to ?? goalView();
      atGoal = to === null;
    } else {
      tween = { from: view, to, start: performance.now(), duration };
      atGoal = false;
    }
    invalidate();
  };

  // ------------------------------------------------------------------ size
  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return;
    size = { width, height };
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Shift the picture down so the figure sits below the status tag.
    camera.setViewOffset(width, height, 0, -(HUD_TOP - HUD_BOTTOM) / 2, width, height);
    camera.updateProjectionMatrix();
    defaultView = {
      yaw: 0,
      target: DEFAULT_TARGET,
      distance: defaultDistance(FOV, height, figureFit()),
    };
    if (!tween) {
      view = atGoal ? goalView() : clampView(view, zoomLimits(defaultView.distance));
    }
    invalidate();
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  observer?.observe(host);

  // ------------------------------------------------------------------ picking
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pick = (clientX: number, clientY: number): BodyRegionId | null => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(astronaut.root, true).map((h) => ({
      object: h.object,
      point: astronaut.root.worldToLocal(h.point.clone()),
    }));
    return regionOfHits(hits, HIT_POINTS, true);
  };

  // ------------------------------------------------------------------ gestures
  const apply = (effect: GestureEffect | null) => {
    if (!effect) return;
    const limits = zoomLimits(defaultView.distance);
    switch (effect.type) {
      case 'dragStart':
        // A drag wins over a running camera move and over a spin.
        tween = null;
        velocity = 0;
        atGoal = false;
        break;
      case 'rotate':
        tween = null;
        atGoal = false;
        view = applyDrag(view, effect.dx, size.width);
        invalidate();
        break;
      case 'zoom':
        tween = null;
        velocity = 0;
        atGoal = false;
        view = zoomBy(view, effect.factor, limits);
        invalidate();
        break;
      case 'release': {
        const rate = dragVelocityToYawRate(effect.velocity, size.width);
        velocity = reduced ? 0 : Math.max(-MAX_SPIN, Math.min(MAX_SPIN, rate));
        invalidate();
        break;
      }
      case 'tap': {
        const region = pick(effect.x, effect.y);
        if (region) callbacks().onSelect(region);
        else callbacks().onBackgroundTap();
        break;
      }
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const result = pointerDown(gesture, e.pointerId, { x: e.clientX, y: e.clientY }, e.timeStamp);
    if (result.state === gesture) return;
    gesture = result.state;
    // A finger on the figure stops a spin where it is.
    velocity = 0;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // The pointer may already be gone; the gesture still works without capture.
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const result = pointerMove(gesture, e.pointerId, { x: e.clientX, y: e.clientY }, e.timeStamp);
    gesture = result.state;
    apply(result.effect);
  };
  const onPointerUp = (e: PointerEvent) => {
    const result = pointerUp(gesture, e.pointerId, { x: e.clientX, y: e.clientY }, e.timeStamp);
    gesture = result.state;
    apply(result.effect);
  };
  const onPointerCancel = (e: PointerEvent) => {
    gesture = pointerCancel(gesture, e.pointerId).state;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    tween = null;
    velocity = 0;
    atGoal = false;
    view = zoomBy(view, Math.exp(-e.deltaY * 0.0015), zoomLimits(defaultView.distance));
    invalidate();
  };
  const onContextLost = (e: Event) => {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    callbacks().onContextLost();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('webglcontextlost', onContextLost);

  applyAppearance();
  resize();

  return {
    setStatuses(next) {
      if (next === statuses || BODY_REGION_IDS.every((id) => next[id] === statuses[id])) {
        statuses = next;
        return;
      }
      statuses = next;
      applyAppearance();
      invalidate();
    },
    setSelected(next) {
      if (next === selected) return;
      selected = next;
      applyAppearance();
      startTween(null, FOCUS_MS);
    },
    setFit(next) {
      if (next.width === fit.width && next.height === fit.height) return;
      fit = next;
      resize();
    },
    setReducedMotion(next) {
      reduced = next;
      if (reduced) velocity = 0;
    },
    turn(direction) {
      startTween(rotateBy(tween?.to ?? view, direction * KEY_TURN), STEP_MS);
    },
    zoom(factor) {
      startTween(zoomBy(tween?.to ?? view, factor, zoomLimits(defaultView.distance)), STEP_MS);
    },
    reset() {
      startTween(null, FOCUS_MS);
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      observer?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('lostpointercapture', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      astronaut.dispose();
      if (shadow) {
        shadow.geometry.dispose();
        const material = shadow.material as MeshBasicMaterial;
        material.map?.dispose();
        material.dispose();
      }
      try {
        envTarget.dispose();
        renderer.dispose();
        // Free the GL context now (StrictMode remounts and route changes would pile them up).
        renderer.forceContextLoss();
      } catch {
        // The context may already be lost (that is why we are unmounting); nothing left to free.
      }
      canvas.remove();
    },
  };
}
