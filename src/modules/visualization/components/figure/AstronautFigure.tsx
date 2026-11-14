import { motion, useReducedMotion } from 'framer-motion';
import type { SVGProps } from 'react';
import type { BodyRegionId } from '@core/types';
import { STATUS_COLOR_VAR, type DisplayStatus } from '@core/ui';
import { STAGE } from './hitAreas';

/*
 * Hand-drawn astronaut (spec §8). Adult proportions: figure y 20→500 (480 px), helmet/head
 * 64–72 px ≈ 7.5 heads, centre x = 292, shoulders y≈100, waist y≈260, knees y≈400. Slight ¾ turn:
 * the far (viewer's right) side is drawn a few px narrower and the chest seam sits at x = 296.
 * No face — the visor is dark glass with one soft reflection.
 *
 * Suit colours are illustration constants (matte white fabric), not UI tokens. Status colours
 * come only from STATUS_COLOR_VAR; orange (--av-suit-accent) only on two tiny suit details.
 */

const SUIT = {
  light: '#EEF1F7',
  dark: '#C9CFDC',
  shadeEdge: '#6E7891',
  line: '#A9B1C3',
  ringLight: '#DCE0E9',
  ringDark: '#A9B1C2',
  gloveLight: '#D9DEE8',
  gloveDark: '#AEB6C7',
  pack: '#B3BACA',
  panel: '#DDE2EB',
  visorTop: '#1A2140',
  visorBottom: '#0B1026',
} as const;

/** Breathing period for nominal regions; mirrors --av-breath (4.5 s) in tokens.css. */
const BREATH_SECONDS = 4.5;

type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'path'; d: string };

const circle = (cx: number, cy: number, r: number): Shape => ({ kind: 'circle', cx, cy, r });
const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
});
const path = (d: string): Shape => ({ kind: 'path', d });

function renderShape(shape: Shape, key: string, props: SVGProps<SVGElement>) {
  switch (shape.kind) {
    case 'circle':
      return (
        <circle
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          {...(props as SVGProps<SVGCircleElement>)}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          {...(props as SVGProps<SVGEllipseElement>)}
        />
      );
    case 'path':
      return <path key={key} d={shape.d} {...(props as SVGProps<SVGPathElement>)} />;
  }
}

// ── Suit geometry ────────────────────────────────────────────────────────────────────────────
const PART = {
  backpack: path(
    'M 252 92 Q 246 92 246 98 L 246 232 Q 246 240 254 240 L 334 240 Q 342 240 342 232 L 342 98 Q 342 92 336 92 Z',
  ),
  legL: path(
    'M 244 294 C 241 330 244 366 249 398 C 252 422 250 446 252 472 L 285 472 C 286 446 287 422 288 400 C 290 370 293 336 293 306 Z',
  ),
  legR: path(
    'M 295 306 C 296 336 299 370 301 400 C 302 422 304 446 305 472 L 336 472 C 338 446 336 422 338 398 C 342 366 344 330 342 294 Z',
  ),
  bootL: path(
    'M 251 466 C 246 476 243 489 246 498 C 261 501 279 501 291 498 C 293 487 290 475 287 466 Z',
  ),
  bootR: path(
    'M 304 466 C 301 475 299 487 301 498 C 312 501 329 501 342 498 C 344 489 342 476 338 466 Z',
  ),
  torso: path(
    'M 262 95 C 248 97 238 104 237 120 C 236 150 238 180 242 205 C 245 225 250 242 252 258 C 248 272 244 286 244 300 C 262 308 280 316 294 316 C 308 316 326 308 342 300 C 342 286 338 272 335 258 C 337 242 341 225 344 205 C 347 180 348 150 347 120 C 346 104 338 97 326 95 Z',
  ),
  armL: path(
    'M 244 97 C 226 96 214 106 212 124 C 209 150 208 178 208 205 C 207 228 206 250 206 270 L 231 272 C 233 252 236 230 239 206 C 242 184 248 160 252 140 C 256 118 256 99 244 97 Z',
  ),
  armR: path(
    'M 340 97 C 355 96 364 106 366 124 C 368 150 370 178 370 205 C 370 228 370 250 370 270 L 348 272 C 346 252 344 230 341 206 C 338 184 334 160 331 140 C 328 118 330 99 340 97 Z',
  ),
  gloveL: path(
    'M 206 274 C 203 286 204 300 209 309 C 213 316 222 318 227 312 C 232 305 233 292 231 274 Z',
  ),
  gloveR: path(
    'M 348 274 C 347 292 348 305 352 312 C 357 318 366 316 369 309 C 373 300 373 286 370 274 Z',
  ),
  collar: ellipse(293, 94, 31, 8),
  helmet: ellipse(292, 56, 35, 36),
} as const;

const VISOR =
  'M 264 62 C 264 50 277 44 294 44 C 311 44 324 50 324 62 L 324 66 C 324 78 311 84 294 84 C 277 84 264 78 264 66 Z';
const VISOR_GLINT =
  'M 271 62 C 272 54 279 49 290 48 C 283 52 278 57 275 65 C 273 65 271 64 271 62 Z';

/** Outer silhouette of the whole suit — clip for the inner glows and the whole-body halo. */
const SILHOUETTE: Shape[] = Object.values(PART);

const SEAMS = [
  'M 296 104 C 297 150 297 210 296 254', // chest centre seam (¾ cue: shifted to the far side)
  'M 214 122 C 224 114 240 112 252 118', // shoulder bearings
  'M 332 118 C 344 112 357 114 365 122',
  'M 209 206 C 216 210 232 210 239 205', // elbow folds
  'M 342 205 C 350 210 363 210 370 206',
  'M 249 398 C 260 404 278 404 289 398', // knee folds
  'M 302 398 C 314 404 330 404 340 398',
];

// ── Region glow shapes (anatomical positions, spec §8) ───────────────────────────────────────
type GlowFilter = 'av-glow' | 'av-glow-3' | 'av-glow-8';

interface RegionShape {
  shapes: Shape[];
  /** 'fill' = soft blob; 'stroke' = thin luminous line (vessels, bones, halo). */
  paint: 'fill' | 'stroke';
  strokeWidth?: number;
  filter: GlowFilter;
}

const REGION_SHAPES: Record<BodyRegionId, RegionShape> = {
  brain: { shapes: [circle(292, 38, 22)], paint: 'fill', filter: 'av-glow' },
  eyes: { shapes: [ellipse(292, 62, 26, 8)], paint: 'fill', filter: 'av-glow' },
  heart: { shapes: [circle(308, 160, 18)], paint: 'fill', filter: 'av-glow' },
  lungs: {
    shapes: [ellipse(272, 165, 22, 34), ellipse(314, 165, 22, 34)],
    paint: 'fill',
    filter: 'av-glow',
  },
  blood: {
    shapes: [
      path('M 240 132 C 236 170 230 220 222 266'),
      path('M 344 132 C 348 170 352 220 358 266'),
      path('M 283 304 C 282 360 280 420 279 466'),
      path('M 305 304 C 307 360 309 420 310 466'),
    ],
    paint: 'stroke',
    strokeWidth: 3,
    filter: 'av-glow-3',
  },
  bones: {
    shapes: [
      path('M 266 306 L 268 392'),
      path('M 269 410 L 270 466'),
      path('M 321 306 L 321 392'),
      path('M 321 410 L 320 466'),
    ],
    paint: 'stroke',
    strokeWidth: 7,
    filter: 'av-glow-3',
  },
  muscles: {
    shapes: [
      ellipse(232, 175, 14, 26),
      ellipse(352, 175, 12, 26),
      ellipse(267, 342, 15, 32),
      ellipse(320, 342, 14, 32),
    ],
    paint: 'fill',
    filter: 'av-glow',
  },
  immune: {
    shapes: [circle(292, 96, 8), circle(248, 140, 8), circle(336, 140, 8)],
    paint: 'fill',
    filter: 'av-glow',
  },
  kidneys: {
    shapes: [circle(278, 250, 10), circle(306, 250, 10)],
    paint: 'fill',
    filter: 'av-glow',
  },
  whole_body: { shapes: SILHOUETTE, paint: 'stroke', strokeWidth: 6, filter: 'av-glow-8' },
};

/** Inner glows, back to front. whole_body is drawn separately, behind the suit. */
const INNER_ORDER: BodyRegionId[] = [
  'blood',
  'bones',
  'muscles',
  'lungs',
  'kidneys',
  'immune',
  'heart',
  'brain',
  'eyes',
];

/** Glow strength per status: nominal is a faint hint, problems glow clearly (steady). */
const GLOW_OPACITY: Record<Exclude<DisplayStatus, 'stale' | 'none'>, number> = {
  nominal: 0.5,
  advisory: 0.6,
  caution: 0.78,
  warning: 0.88,
};

interface RegionLayerProps {
  id: BodyRegionId;
  status: DisplayStatus;
  selected: boolean;
  breathe: boolean;
  /** Drawn behind the suit: only the outer half of each stroke shows, so double the width. */
  behindSuit?: boolean;
}

function RegionLayer({ id, status, selected, breathe, behindSuit = false }: RegionLayerProps) {
  const spec = REGION_SHAPES[id];
  const widthScale = behindSuit ? 2 : 1;

  const paintProps = (color: string): SVGProps<SVGElement> =>
    spec.paint === 'fill'
      ? { fill: color }
      : {
          fill: 'none',
          stroke: color,
          strokeWidth: (spec.strokeWidth ?? 3) * widthScale,
          strokeLinecap: 'round',
        };

  let glow = null;
  if (status === 'stale') {
    // Old data never looks like a health state: flat grey, no glow.
    glow = (
      <g opacity={0.35}>
        {spec.shapes.map((s, i) => renderShape(s, `s${i}`, paintProps(STATUS_COLOR_VAR.stale)))}
      </g>
    );
  } else if (status !== 'none') {
    const color = STATUS_COLOR_VAR[status];
    glow = (
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={false}
        animate={breathe ? { opacity: [0.85, 1], scale: [1, 1.02] } : { opacity: 1, scale: 1 }}
        transition={
          breathe
            ? {
                duration: BREATH_SECONDS,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }
            : { duration: 0 }
        }
      >
        <g filter={`url(#${spec.filter})`} opacity={GLOW_OPACITY[status]}>
          {spec.shapes.map((s, i) => renderShape(s, `g${i}`, paintProps(color)))}
        </g>
      </motion.g>
    );
  }

  const showContour = status === 'none' || selected;
  const contour = showContour ? (
    <g
      fill="none"
      stroke={selected ? 'var(--av-accent)' : STATUS_COLOR_VAR.none}
      strokeWidth={(selected ? 3 : 1.5) * widthScale}
      strokeLinecap="round"
      strokeDasharray={status === 'none' ? '6 6' : undefined}
    >
      {spec.shapes.map((s, i) => renderShape(s, `c${i}`, {}))}
    </g>
  ) : null;

  return (
    <g data-region={id} data-status={status}>
      {glow && (behindSuit ? glow : <g clipPath="url(#av-suit-clip)">{glow}</g>)}
      {contour}
    </g>
  );
}

export interface AstronautFigureProps {
  regions: Record<BodyRegionId, DisplayStatus>;
  selected: BodyRegionId | null;
}

export function AstronautFigure({ regions, selected }: AstronautFigureProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const layer = (id: BodyRegionId, behindSuit = false) => (
    <RegionLayer
      key={id}
      id={id}
      status={regions[id]}
      selected={selected === id}
      breathe={regions[id] === 'nominal' && !reduceMotion}
      behindSuit={behindSuit}
    />
  );
  const suitPart = (shape: Shape, key: string, fill = 'url(#av-suit-fill)') => (
    <g key={key}>
      {renderShape(shape, 'base', { fill, stroke: SUIT.line, strokeWidth: 1, strokeOpacity: 0.6 })}
      {renderShape(shape, 'volume', { fill: 'url(#av-suit-volume)' })}
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      width={STAGE.width}
      height={STAGE.height}
      aria-hidden="true"
      focusable="false"
      className="block"
    >
      <defs>
        <linearGradient id="av-suit-fill" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={SUIT.light} />
          <stop offset="1" stopColor={SUIT.dark} />
        </linearGradient>
        <radialGradient id="av-suit-volume" cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor={SUIT.shadeEdge} stopOpacity="0.28" />
        </radialGradient>
        <linearGradient id="av-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SUIT.ringLight} />
          <stop offset="1" stopColor={SUIT.ringDark} />
        </linearGradient>
        <linearGradient id="av-glove" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={SUIT.gloveLight} />
          <stop offset="1" stopColor={SUIT.gloveDark} />
        </linearGradient>
        <linearGradient id="av-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SUIT.visorTop} />
          <stop offset="1" stopColor={SUIT.visorBottom} />
        </linearGradient>
        <linearGradient id="av-visor-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* One shared glow blur (+ a fine one for vessels/bones and a halo one for the outline). */}
        <filter id="av-glow" filterUnits="userSpaceOnUse" x="0" y="0" width="584" height="520">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="av-glow-3" filterUnits="userSpaceOnUse" x="0" y="0" width="584" height="520">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="av-glow-8" filterUnits="userSpaceOnUse" x="0" y="0" width="584" height="520">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="av-shadow" filterUnits="userSpaceOnUse" x="0" y="440" width="584" height="80">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="av-suit-clip">
          {SILHOUETTE.map((s, i) => renderShape(s, `clip${i}`, {}))}
        </clipPath>
      </defs>

      {/* Single soft ground shadow */}
      <ellipse
        cx={294}
        cy={503}
        rx={72}
        ry={8}
        fill="#000000"
        opacity={0.45}
        filter="url(#av-shadow)"
      />

      {/* Whole-body halo sits behind the suit so only the outer rim shows */}
      {layer('whole_body', true)}

      {/* Suit, back to front */}
      {renderShape(PART.backpack, 'backpack', { fill: SUIT.pack })}
      {suitPart(PART.legL, 'legL')}
      {suitPart(PART.legR, 'legR')}
      {suitPart(PART.bootL, 'bootL', 'url(#av-glove)')}
      {suitPart(PART.bootR, 'bootR', 'url(#av-glove)')}
      {suitPart(PART.torso, 'torso')}
      <path
        d="M 251 252 C 274 257 314 257 336 252 L 337 264 C 314 269 274 269 250 264 Z"
        fill="url(#av-ring)"
      />
      {suitPart(PART.armL, 'armL')}
      {suitPart(PART.armR, 'armR')}
      <ellipse cx={218} cy={272} rx={13} ry={4.5} fill="url(#av-ring)" />
      <ellipse cx={359} cy={272} rx={11.5} ry={4.5} fill="url(#av-ring)" />
      {suitPart(PART.gloveL, 'gloveL', 'url(#av-glove)')}
      {suitPart(PART.gloveR, 'gloveR', 'url(#av-glove)')}
      {renderShape(PART.collar, 'collar', { fill: 'url(#av-ring)' })}
      {suitPart(PART.helmet, 'helmet')}
      <path d={VISOR} fill="url(#av-visor)" stroke={SUIT.ringDark} strokeWidth={3} />

      {/* Small, muted suit details — the only orange in the app */}
      <g
        fill="none"
        stroke={SUIT.line}
        strokeWidth={1.2}
        strokeOpacity={0.55}
        strokeLinecap="round"
      >
        {SEAMS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <rect x={275} y={196} width={42} height={24} rx={6} fill={SUIT.panel} stroke={SUIT.line} />
      <rect
        x={280}
        y={201}
        width={16}
        height={3}
        rx={1.5}
        fill="var(--av-suit-accent)"
        opacity={0.7}
      />
      <circle cx={305} cy={211} r={2.5} fill={SUIT.pack} />
      <circle cx={311} cy={211} r={2.5} fill={SUIT.pack} />
      <path
        d="M 210 144 C 222 147 240 147 251 144 L 250 150 C 239 153 222 153 210 150 Z"
        fill="var(--av-suit-accent)"
        opacity={0.55}
      />

      {/* Health regions: soft light showing through the suit */}
      {INNER_ORDER.map((id) => layer(id))}

      {/* Visor glass reflection stays on top of the eye glow */}
      <path d={VISOR_GLINT} fill="url(#av-visor-glint)" />
    </svg>
  );
}
