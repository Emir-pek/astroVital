import { memo } from 'react';
import {
  BODY_ORDER,
  BOOT_SEAMS,
  CREASES,
  DCM,
  FIGURE_BOX,
  FOLDS,
  GLOVE_LINES,
  HELMET_SEAM,
  HOSE,
  ID_STRIPES,
  KNEE_PADS,
  LAMP,
  PACK_DETAIL,
  PART,
  RING,
  SEAMS,
  SILHOUETTE,
  SOLES,
  VISOR,
  VISOR_FRAME,
  VISOR_REFLECTION,
} from './geometry';
import { FIGURE_VIEWBOX_ATTR } from './layout';
import { stop, suit } from './renderShape';

/*
 * The static suit illustration. It never changes after mount, so it lives on its own SVG layer:
 * the blur filters used for soft shading are rasterised once and are never inside an animated
 * subtree (only the whole-body halo breathes, on its own layer below).
 *
 * Shading recipe — one key light from the upper left, applied the same way to every part, so the
 * light is consistent and follows each part's own contour (no "tube" gradients):
 *   1. base: matte white, a whisper lighter towards the light across the whole figure;
 *   2. form shadow: the area OUTSIDE the part, shifted towards the light, blurred and clipped to
 *      the part — it darkens the part's lower-right inside edge by as much as the part turns away;
 *   3. form light: the same, shifted away from the light, in white — the upper-left shoulder of
 *      every volume catches the light;
 *   4. cast shadows where a nearer part overlaps a farther one (offset away from the light);
 *   5. a thin cool rim light on the right-hand outer silhouette only, against the night sky;
 *   6. restrained hard-surface detail: bearings, chest unit, hose, seams, folds, soles.
 */

/** Rectangle around the whole figure; with a part path and even-odd fill = "outside the part". */
const FRAME = 'M 150 -20 H 460 V 540 H 150 Z';

/** Form-shadow distance (authoring px) and blur per part: proportional to the part's girth. */
const FORM: Record<keyof typeof PART, { size: number; blur: string }> = {
  pack: { size: 10, blur: 'b5' },
  helmet: { size: 20, blur: 'b9' },
  torso: { size: 34, blur: 'b14' },
  brief: { size: 14, blur: 'b7' },
  armNear: { size: 15, blur: 'b7' },
  armFar: { size: 13, blur: 'b7' },
  gloveNear: { size: 9, blur: 'b3' },
  gloveFar: { size: 9, blur: 'b3' },
  thumbNear: { size: 4, blur: 'b2' },
  thumbFar: { size: 4, blur: 'b2' },
  legNear: { size: 17, blur: 'b7' },
  legFar: { size: 16, blur: 'b7' },
  bootNear: { size: 12, blur: 'b5' },
  bootFar: { size: 12, blur: 'b5' },
};

/** Where the key light comes from (unit vector, upper left). */
const LIGHT = { x: -0.6, y: -0.8 };

interface Props {
  uid: string;
}

function SuitArtImpl({ uid }: Props) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  /** Blur filter in figure space (tight region, static layer). */
  const blur = (name: string, sd: number) => (
    <filter
      key={name}
      id={id(name)}
      filterUnits="userSpaceOnUse"
      x={FIGURE_BOX.x - 30}
      y={FIGURE_BOX.y - 30}
      width={FIGURE_BOX.width + 60}
      height={FIGURE_BOX.height + 60}
      colorInterpolationFilters="sRGB"
    >
      <feGaussianBlur stdDeviation={sd} />
    </filter>
  );

  /**
   * The outside of `d`, shifted by `dist` along the light (negative = towards it), blurred and
   * clipped to the part: an inner band along the edges that face away from (or towards) the light.
   */
  const edgeBand = (
    clip: string,
    d: string,
    dist: number,
    filter: string,
    color: string,
    opacity: number,
  ) => (
    <g clipPath={url(clip)}>
      <path
        d={`${FRAME} ${d}`}
        fillRule="evenodd"
        fill={color}
        opacity={opacity}
        filter={url(filter)}
        transform={`translate(${LIGHT.x * dist} ${LIGHT.y * dist})`}
      />
    </g>
  );

  /**
   * One body part with its full volume recipe. Shadow and light bands scale with the size of the
   * part (a big chest turns slowly, a thumb quickly).
   */
  const part = (name: keyof typeof PART, strength = 1) => {
    const d = PART[name];
    const f = FORM[name];
    return (
      <g key={name}>
        <path d={d} fill={url('base')} />
        {/* Broad, soft form shadow + a tighter, darker core where the form turns away. */}
        {edgeBand(`c-${name}`, d, f.size, f.blur, suit('shade'), 0.85 * strength)}
        {edgeBand(`c-${name}`, d, f.size * 0.35, 'b3', suit('deep'), 0.24 * strength)}
        {/* Light on the planes facing the key light. */}
        {edgeBand(`c-${name}`, d, -f.size, f.blur, suit('sheen'), 0.95)}
      </g>
    );
  };

  /** A nearer part's soft shadow on the parts behind it (clip = the parts that receive it). */
  const castShadow = (d: string, clip: string, opacity = 0.3, dist = 7) => (
    <g clipPath={url(clip)}>
      <path
        d={d}
        fill={suit('deep')}
        opacity={opacity}
        filter={url('b5')}
        transform={`translate(${-LIGHT.x * dist} ${-LIGHT.y * dist * 0.6})`}
      />
    </g>
  );

  /** Convolute folds: a soft dark valley under a fine light ridge, clipped to the part. */
  const foldSet = (clip: string, lines: string[], strength = 1) => (
    <g clipPath={url(clip)} fill="none" strokeLinecap="round">
      <g filter={url('b1')} stroke={suit('deep')} strokeOpacity={0.32 * strength} strokeWidth={3.2}>
        {lines.map((d) => (
          <path key={d} d={d} transform="translate(0.8 2.2)" />
        ))}
      </g>
      <g stroke={suit('sheen')} strokeOpacity={0.75 * strength} strokeWidth={1.1}>
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );

  /** Raised knee patch: its own small volume and a stitched edge. */
  const kneePad = (d: string, clip: string) => (
    <g>
      {edgeBand(clip, d, 5, 'b2', suit('shade'), 0.7)}
      {edgeBand(clip, d, -4, 'b2', suit('sheen'), 0.7)}
      <path d={d} fill="none" stroke={suit('shade')} strokeOpacity={0.7} strokeWidth={0.8} />
      <path
        d={d}
        fill="none"
        stroke={suit('shade')}
        strokeOpacity={0.5}
        strokeWidth={0.5}
        strokeDasharray="1.4 2.2"
        transform="translate(0.8 1.6) scale(1)"
      />
    </g>
  );

  /** Fine dark lines inside a part (glove fingers, panel edges). */
  const lines = (clip: string, ds: readonly string[], opacity = 0.35) => (
    <g
      clipPath={url(clip)}
      fill="none"
      stroke={suit('deep')}
      strokeOpacity={opacity}
      strokeWidth={0.9}
      strokeLinecap="round"
    >
      {ds.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );

  /** Hardware ring: brushed metal band with a dark lower lip. */
  const ring = (d: string, key: string) => (
    <g key={key}>
      <path d={d} fill={url('hw')} />
      <path d={d} fill="none" stroke={suit('hw-dark')} strokeOpacity={0.45} strokeWidth={0.6} />
    </g>
  );

  const clips: Array<[string, readonly string[]]> = [
    ...Object.entries(PART).map(([k, d]): [string, readonly string[]] => [`c-${k}`, [d]]),
    ['c-body', SILHOUETTE],
    ['c-trunk', [PART.torso, PART.brief, PART.legNear, PART.legFar]],
    ['c-legs', [PART.legNear, PART.legFar]],
    ['c-kneeNear', [KNEE_PADS.near]],
    ['c-kneeFar', [KNEE_PADS.far]],
    ['c-dcm', [DCM.body]],
  ];

  return (
    <svg
      viewBox={FIGURE_VIEWBOX_ATTR}
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
    >
      <defs>
        {/* Matte white, a whisper lighter towards the key light. */}
        <linearGradient
          id={id('base')}
          gradientUnits="userSpaceOnUse"
          x1={220}
          y1={40}
          x2={390}
          y2={500}
        >
          {stop(0, suit('base'))}
          {stop(0.5, suit('base'))}
          {stop(1, suit('mid'))}
        </linearGradient>
        <linearGradient id={id('hw')} x1="0" y1="0" x2="0.15" y2="1">
          {stop(0, suit('hw-hi'))}
          {stop(0.5, suit('hw'))}
          {stop(1, suit('hw-dark'))}
        </linearGradient>
        <linearGradient
          id={id('pack')}
          gradientUnits="userSpaceOnUse"
          x1={190}
          y1={90}
          x2={230}
          y2={236}
        >
          {stop(0, suit('pack'))}
          {stop(1, suit('hw-dark'))}
        </linearGradient>
        <radialGradient id={id('visor')} cx="0.36" cy="0.3" r="0.85">
          {stop(0, suit('visor-hi'))}
          {stop(0.55, suit('visor'))}
          {stop(1, suit('visor-deep'))}
        </radialGradient>
        <linearGradient id={id('visorBand')} x1="0" y1="0" x2="0.4" y2="1">
          {stop(0, suit('sheen'), 0.45)}
          {stop(1, suit('sheen'), 0.02)}
        </linearGradient>
        <radialGradient id={id('ground')}>
          {stop(0, suit('ground'), 0.7)}
          {stop(0.55, suit('ground'), 0.32)}
          {stop(1, suit('ground'), 0)}
        </radialGradient>

        {blur('b1', 1)}
        {blur('b2', 2)}
        {blur('b3', 3)}
        {blur('b5', 5)}
        {blur('b7', 7)}
        {blur('b9', 9)}
        {blur('b14', 14)}

        {/* Everything outside the body silhouette (union of all parts). */}
        <mask
          id={id('outside')}
          maskUnits="userSpaceOnUse"
          x={150}
          y={-20}
          width={310}
          height={560}
        >
          <path d={FRAME} fill="white" />
          {SILHOUETTE.map((d) => (
            <path key={d} d={d} fill="black" />
          ))}
        </mask>

        {clips.map(([name, paths]) => (
          <clipPath key={name} id={id(name)}>
            {paths.map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        ))}
      </defs>

      {/* One soft ground shadow, a little to the right (light from the upper left). */}
      <ellipse cx={318} cy={509} rx={86} ry={8} fill={url('ground')} />

      {/* Life-support pack behind the body (in the shadow of the torso). */}
      <path d={PART.pack} fill={url('pack')} />
      {edgeBand('c-pack', PART.pack, 10, 'b5', suit('deep'), 0.35)}
      {edgeBand('c-pack', PART.pack, -5, 'b2', suit('sheen'), 0.35)}
      <path d={PACK_DETAIL.top} fill={suit('hw-hi')} opacity={0.55} />
      <path d={PACK_DETAIL.panel} fill={suit('hw-dark')} opacity={0.5} />

      {/* Body parts, back to front, each with its own volume. */}
      {BODY_ORDER.map((name) => {
        switch (name) {
          case 'armFar':
            return (
              <g key={name}>
                {part('armFar', 1.15)}
                {foldSet('c-armFar', FOLDS.elbowFar)}
                {foldSet('c-armFar', CREASES.armFar, 0.6)}
                {ring(RING.shoulderFar, 'shoulderFar')}
                {ring(RING.wristFar, 'wristFar')}
              </g>
            );
          case 'legFar':
            return (
              <g key={name}>
                {part('legFar', 1.1)}
                {kneePad(KNEE_PADS.far, 'c-kneeFar')}
                {foldSet('c-legFar', CREASES.legFar, 0.6)}
                {ring(RING.ankleFar, 'ankleFar')}
              </g>
            );
          case 'legNear':
            return (
              <g key={name}>
                {part('legNear')}
                {castShadow(PART.legNear, 'c-legFar', 0.28)}
                {kneePad(KNEE_PADS.near, 'c-kneeNear')}
                {foldSet('c-legNear', CREASES.legNear, 0.6)}
                {ring(RING.ankleNear, 'ankleNear')}
                <g fill="var(--av-suit-accent)" opacity={0.55}>
                  {ID_STRIPES.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
              </g>
            );
          case 'bootFar':
          case 'bootNear': {
            const sole = name === 'bootFar' ? SOLES.far : SOLES.near;
            return (
              <g key={name}>
                {part(name)}
                <path d={sole} fill={suit('sole')} />
                {lines(`c-${name}`, [BOOT_SEAMS[name === 'bootFar' ? 1 : 0]!], 0.4)}
              </g>
            );
          }
          case 'brief':
            return (
              <g key={name}>
                {castShadow(PART.brief, 'c-legs', 0.14, 4)}
                {part('brief', 0.55)}
                {foldSet('c-brief', FOLDS.brief, 0.7)}
              </g>
            );
          case 'torso':
            return (
              <g key={name}>
                {part('torso')}
                {/* Chest volume: lit upper-left plane, soft terminator down the far side. */}
                <g clipPath={url('c-torso')}>
                  <ellipse
                    cx={272}
                    cy={128}
                    rx={34}
                    ry={24}
                    fill={suit('sheen')}
                    opacity={0.55}
                    filter={url('b9')}
                  />
                  <path
                    d="M 356 108 C 364 146 358 186 340 222"
                    fill="none"
                    stroke={suit('deep')}
                    strokeWidth={22}
                    opacity={0.16}
                    filter={url('b9')}
                  />
                  <path
                    d="M 252 206 C 280 214 322 214 348 204"
                    fill="none"
                    stroke={suit('deep')}
                    strokeWidth={10}
                    opacity={0.12}
                    filter={url('b5')}
                  />
                </g>
                {castShadow(PART.torso, 'c-brief', 0.18, 4)}
                {ring(RING.waist, 'waist')}
              </g>
            );
          case 'armNear':
            return (
              <g key={name}>
                {castShadow(PART.armNear, 'c-trunk', 0.32)}
                {part('armNear')}
                {foldSet('c-armNear', FOLDS.elbowNear)}
                {foldSet('c-armNear', CREASES.armNear, 0.6)}
                {ring(RING.shoulderNear, 'shoulderNear')}
                {ring(RING.wristNear, 'wristNear')}
              </g>
            );
          case 'helmet':
            return (
              <g key={name}>
                {castShadow(PART.helmet, 'c-torso', 0.35, 6)}
                {ring(RING.neck, 'neck')}
                {part('helmet')}
              </g>
            );
          case 'gloveNear':
            return (
              <g key={name}>
                {part(name)}
                {lines('c-gloveNear', GLOVE_LINES.near)}
              </g>
            );
          case 'gloveFar':
            return (
              <g key={name}>
                {part(name)}
                {lines('c-gloveFar', GLOVE_LINES.far)}
              </g>
            );
          default:
            return part(name);
        }
      })}

      {/* Thermal-garment seams with stitch lines. */}
      <g fill="none" strokeLinecap="round" clipPath={url('c-body')}>
        <g stroke={suit('shade')} strokeOpacity={0.6} strokeWidth={0.9}>
          {SEAMS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g
          stroke={suit('shade')}
          strokeOpacity={0.45}
          strokeWidth={0.6}
          strokeDasharray="1.5 2.4"
          transform="translate(2 1.2)"
        >
          {SEAMS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>

      {/* Chest display & control module with its umbilical hose. */}
      <path
        d={HOSE.path}
        fill="none"
        stroke={suit('hw-dark')}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path d={HOSE.path} fill="none" stroke={suit('hw')} strokeWidth={4} strokeLinecap="round" />
      <path
        d={HOSE.path}
        fill="none"
        stroke={suit('hw-dark')}
        strokeOpacity={0.55}
        strokeWidth={4}
        strokeDasharray="0.8 2.2"
      />
      <g>
        <path
          d={DCM.body}
          fill={suit('base')}
          transform="translate(3 3)"
          opacity={0.25}
          filter={url('b2')}
        />
        <path d={DCM.body} fill={url('base')} />
        {edgeBand('c-dcm', DCM.body, 4, 'b2', suit('shade'), 0.7)}
        <path
          d={DCM.body}
          fill="none"
          stroke={suit('shade')}
          strokeOpacity={0.7}
          strokeWidth={0.7}
        />
        <path d={DCM.top} fill={suit('hi')} opacity={0.9} />
        <path d={DCM.display} fill={suit('visor')} />
        <path d={DCM.display} fill="none" stroke={suit('hw-dark')} strokeWidth={0.6} />
        {DCM.switches.map((s) => (
          <rect
            key={s.x}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={1.5}
            fill={url('hw')}
            stroke={suit('hw-dark')}
            strokeOpacity={0.5}
            strokeWidth={0.5}
          />
        ))}
        <circle cx={DCM.dial.cx} cy={DCM.dial.cy} r={DCM.dial.r} fill={url('hw')} />
        <circle
          cx={DCM.dial.cx}
          cy={DCM.dial.cy}
          r={DCM.dial.r - 2.3}
          fill="none"
          stroke={suit('hw-dark')}
          strokeOpacity={0.6}
          strokeWidth={0.8}
        />
        <rect
          x={DCM.accent.x}
          y={DCM.accent.y}
          width={DCM.accent.w}
          height={DCM.accent.h}
          rx={1.5}
          fill="var(--av-suit-accent)"
          opacity={0.6}
        />
        <rect
          x={HOSE.connector.x}
          y={HOSE.connector.y}
          width={HOSE.connector.w}
          height={HOSE.connector.h}
          rx={2}
          fill={url('hw')}
          stroke={suit('hw-dark')}
          strokeOpacity={0.6}
          strokeWidth={0.6}
        />
      </g>

      {/* Helmet: dome seam, lamp, visor frame, visor glass and reflections. */}
      <path
        d={HELMET_SEAM}
        fill="none"
        stroke={suit('shade')}
        strokeOpacity={0.6}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <path d={LAMP.body} fill={url('hw')} />
      <path d={LAMP.lens} fill={suit('lens')} />
      <path d={VISOR_FRAME} fill={url('hw')} />
      <path d={VISOR} fill={url('visor')} />
      <path d={VISOR_REFLECTION.band} fill={url('visorBand')} />
      <path d={VISOR_REFLECTION.glint} fill={suit('sheen')} opacity={0.25} />

      {/* Cool rim light on the right-hand outer silhouette only, against the night background. */}
      <g clipPath={url('c-body')}>
        <g filter={url('b2')} transform="translate(-4 1)">
          <path d={FRAME} fill={suit('rim')} mask={url('outside')} />
        </g>
      </g>
    </svg>
  );
}

/** Static suit layer — memoised so React never touches it after mount. */
export const SuitArt = memo(SuitArtImpl);
