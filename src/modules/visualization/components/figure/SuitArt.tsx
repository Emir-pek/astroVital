import { memo, type ReactNode } from 'react';
import {
  DCM,
  FIGURE_BOX,
  CREASES,
  FIGURE_OFFSET_Y,
  FOLDS,
  ID_STRIPES,
  LAMPS,
  PART,
  RING,
  SEAMS,
  VISOR,
  VISOR_FRAME,
  VISOR_REFLECTION,
} from './geometry';
import { stop, suit } from './renderShape';
import { STAGE } from './hitAreas';

/*
 * The static suit illustration. It never changes after mount, so it lives on its own SVG layer:
 * the blur filters used for soft ambient occlusion and fold shading are rasterised once and are
 * never inside an animated subtree (the breathing glows animate on separate layers above).
 *
 * Volume recipe per part (light from the upper left):
 *   1. a horizontal "cylinder" gradient — turning edge → highlight → half-tone → core shadow →
 *      reflected light at the far edge;
 *   2. a vertical overlay that brightens the top and settles the bottom;
 *   3. blurred ambient-occlusion shapes clipped to the part where other parts meet it;
 *   4. small hard-surface details (bearings, rings, chest unit, visor) with their own sheen.
 */

interface Props {
  uid: string;
}

function SuitArtImpl({ uid }: Props) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  /**
   * Base fill + top-light overlay for one closed part. `rim` adds a thin cool-neutral rim light
   * inside the far (right) edge, which separates the shadow side from the night background.
   */
  const part = (d: string, gradient: string, key: string, rim = false) => (
    <g key={key}>
      <path d={d} fill={url(gradient)} />
      <path d={d} fill={url('toplight')} />
      {rim && (
        <>
          <clipPath id={id(`rim-${key}`)}>
            <path d={d} />
          </clipPath>
          <path
            d={d}
            clipPath={url(`rim-${key}`)}
            fill="none"
            stroke={url('rim')}
            strokeWidth={4}
          />
        </>
      )}
    </g>
  );

  /** Blurred ambient-occlusion shapes, clipped to a part (blur first, then clip). */
  const occlusion = (clip: string, children: ReactNode) => (
    <g clipPath={url(clip)}>
      <g filter={url('ao')} fill={suit('deep')} stroke={suit('deep')} strokeLinecap="round">
        {children}
      </g>
    </g>
  );

  /** Convolute folds: a soft dark valley under a fine light ridge, clipped to the limb. */
  const foldSet = (clip: string, lines: string[], strength = 1) => (
    <g clipPath={url(clip)} fill="none" strokeLinecap="round">
      <g
        filter={url('fold')}
        stroke={suit('deep')}
        strokeOpacity={0.3 * strength}
        strokeWidth={3.6}
      >
        {lines.map((d) => (
          <path key={d} d={d} transform="translate(0 2.4)" />
        ))}
      </g>
      <g stroke={suit('hi')} strokeOpacity={0.6 * strength} strokeWidth={1.2}>
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );

  const ring = (d: string, key: string) => (
    <g key={key}>
      <path d={d} fill={url('hw')} />
      <path d={d} fill="none" stroke={suit('hw-dark')} strokeOpacity={0.35} strokeWidth={0.6} />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      width={STAGE.width}
      height={STAGE.height}
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0"
    >
      <defs>
        {/* Cylinder shading for near-side parts. */}
        <linearGradient id={id('form')} x1="0" y1="0" x2="1" y2="0">
          {stop(0, suit('mid'))}
          {stop(0.16, suit('base'))}
          {stop(0.36, suit('hi'))}
          {stop(0.58, suit('base'))}
          {stop(0.84, suit('shade'))}
          {stop(1, suit('reflect'))}
        </linearGradient>
        {/* Far-side parts sit further from the key light. */}
        <linearGradient id={id('formFar')} x1="0" y1="0" x2="1" y2="0">
          {stop(0, suit('mid'))}
          {stop(0.24, suit('base'))}
          {stop(0.46, suit('base'))}
          {stop(0.78, suit('shade'))}
          {stop(0.93, suit('shade'))}
          {stop(1, suit('reflect'))}
        </linearGradient>
        <linearGradient id={id('torso')} x1="0" y1="0" x2="1" y2="0">
          {stop(0, suit('mid'))}
          {stop(0.14, suit('base'))}
          {stop(0.34, suit('hi'))}
          {stop(0.56, suit('base'))}
          {stop(0.82, suit('shade'))}
          {stop(0.95, suit('shade'))}
          {stop(1, suit('reflect'))}
        </linearGradient>
        <linearGradient id={id('glove')} x1="0" y1="0" x2="1" y2="0.3">
          {stop(0, suit('mid'))}
          {stop(0.35, suit('base'))}
          {stop(0.78, suit('shade'))}
          {stop(1, suit('reflect'))}
        </linearGradient>
        <linearGradient id={id('toplight')} x1="0" y1="0" x2="0" y2="1">
          {stop(0, suit('sheen'), 0.32)}
          {stop(0.3, suit('sheen'), 0)}
          {stop(0.7, suit('deep'), 0)}
          {stop(1, suit('deep'), 0.16)}
        </linearGradient>
        <linearGradient id={id('hw')} x1="0" y1="0" x2="0.15" y2="1">
          {stop(0, suit('hw-hi'))}
          {stop(0.5, suit('hw'))}
          {stop(1, suit('hw-dark'))}
        </linearGradient>
        <linearGradient id={id('pack')} x1="0" y1="0" x2="1" y2="0.4">
          {stop(0, suit('mid'))}
          {stop(0.4, suit('pack'))}
          {stop(1, suit('hw-dark'))}
        </linearGradient>
        <radialGradient id={id('helmet')} cx="0.36" cy="0.3" r="0.78">
          {stop(0, suit('hi'))}
          {stop(0.45, suit('base'))}
          {stop(0.8, suit('shade'))}
          {stop(1, suit('hw-dark'))}
        </radialGradient>
        <radialGradient id={id('visor')} cx="0.42" cy="0.32" r="0.8">
          {stop(0, suit('visor-hi'))}
          {stop(0.55, suit('visor'))}
          {stop(1, suit('visor-deep'))}
        </radialGradient>
        <linearGradient id={id('visorBand')} x1="0" y1="0" x2="0.4" y2="1">
          {stop(0, suit('sheen'), 0.42)}
          {stop(1, suit('sheen'), 0.02)}
        </linearGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="0">
          {stop(0, suit('sheen'), 0)}
          {stop(0.8, suit('sheen'), 0)}
          {stop(1, suit('sheen'), 0.5)}
        </linearGradient>
        <radialGradient id={id('sheen')}>
          {stop(0, suit('sheen'), 0.75)}
          {stop(1, suit('sheen'), 0)}
        </radialGradient>
        <radialGradient id={id('ground')}>
          {stop(0, suit('ground'), 0.55)}
          {stop(0.6, suit('ground'), 0.25)}
          {stop(1, suit('ground'), 0)}
        </radialGradient>

        {/* Soft shading blurs: tight figure-sized regions, used only on this static layer. */}
        <filter
          id={id('ao')}
          filterUnits="userSpaceOnUse"
          x={FIGURE_BOX.x}
          y={FIGURE_BOX.y}
          width={FIGURE_BOX.width}
          height={FIGURE_BOX.height}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <filter
          id={id('fold')}
          filterUnits="userSpaceOnUse"
          x={FIGURE_BOX.x}
          y={FIGURE_BOX.y}
          width={FIGURE_BOX.width}
          height={FIGURE_BOX.height}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="1.2" />
        </filter>

        {(
          [
            ['c-torso', [PART.torso]],
            ['c-brief', [PART.brief]],
            ['c-legs', [PART.legNear, PART.legFar]],
            ['c-legNear', [PART.legNear]],
            ['c-legFar', [PART.legFar]],
            ['c-armNear', [PART.armNear]],
            ['c-armFar', [PART.armFar]],
            ['c-helmet', [PART.helmet]],
            ['c-boots', [PART.bootNear, PART.bootFar]],
          ] as const
        ).map(([name, paths]) => (
          <clipPath key={name} id={id(name)}>
            {paths.map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        ))}
      </defs>

      <g transform={`translate(0 ${FIGURE_OFFSET_Y})`}>
        {/* Contact shadow on the floor (gradient, no blur). */}
        <ellipse cx={300} cy={503} rx={92} ry={10} fill={url('ground')} />
        <ellipse cx={275} cy={502} rx={30} ry={4} fill={url('ground')} />
        <ellipse cx={330} cy={502} rx={28} ry={4} fill={url('ground')} />

        {/* Life-support pack behind the body (mostly in shadow). */}
        <path d={PART.pack} fill={url('pack')} />
        <path d={PART.pack} fill={url('toplight')} />

        {/* Far arm (behind the torso). */}
        {part(PART.armFar, 'formFar', 'armFar', true)}
        {occlusion(
          'c-armFar',
          <path
            d="M 362 112 C 360 150 360 190 362 230"
            fill="none"
            strokeWidth={16}
            opacity={0.42}
          />,
        )}
        {foldSet('c-armFar', CREASES.armFar, 0.6)}
        {foldSet('c-armFar', FOLDS.elbowFar)}
        {ring(RING.shoulderFar, 'shoulderFar')}
        {ring(RING.wristFar, 'wristFar')}
        {part(PART.gloveFar, 'glove', 'gloveFar', true)}
        {part(PART.thumbFar, 'glove', 'thumbFar')}
        <g
          fill="none"
          stroke={suit('deep')}
          strokeOpacity={0.22}
          strokeWidth={1}
          strokeLinecap="round"
        >
          <path d="M 382 300 C 382 308 383 314 384 319" />
          <path d="M 390 298 C 390 306 390 312 391 316" />
          <path d="M 369 297 C 367 293 367 287 369 282" />
        </g>

        {/* Legs. */}
        {part(PART.legFar, 'formFar', 'legFar', true)}
        {part(PART.legNear, 'form', 'legNear')}
        {occlusion(
          'c-legs',
          <>
            <path
              d="M 240 280 C 270 294 330 294 356 280"
              fill="none"
              strokeWidth={16}
              opacity={0.4}
            />
            <path d="M 298 278 L 293 452" fill="none" strokeWidth={9} opacity={0.28} />
            <path d="M 303 278 L 308 452" fill="none" strokeWidth={9} opacity={0.34} />
          </>,
        )}
        {foldSet('c-legNear', CREASES.legNear, 0.6)}
        {foldSet('c-legFar', CREASES.legFar, 0.6)}
        {foldSet('c-legNear', FOLDS.kneeNear)}
        {foldSet('c-legFar', FOLDS.kneeFar)}
        {ring(RING.thighNear, 'thighNear')}
        {ring(RING.thighFar, 'thighFar')}
        <g fill="var(--av-suit-accent)" opacity={0.5}>
          {ID_STRIPES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {ring(RING.ankleNear, 'ankleNear')}
        {ring(RING.ankleFar, 'ankleFar')}

        {/* Boots. */}
        {part(PART.bootFar, 'glove', 'bootFar', true)}
        {part(PART.bootNear, 'glove', 'bootNear')}
        <g clipPath={url('c-boots')}>
          <rect x={240} y={494} width={120} height={10} fill={suit('sole')} />
          <rect x={240} y={492.5} width={120} height={1.5} fill={suit('hw-dark')} opacity={0.6} />
        </g>
        <g
          fill="none"
          stroke={suit('deep')}
          strokeOpacity={0.25}
          strokeWidth={1}
          strokeLinecap="round"
        >
          <path d="M 262 481 C 272 477 286 478 295 486" />
          <path d="M 316 481 C 326 477 339 478 349 486" />
        </g>

        {/* Lower torso (brief) and the waist bearing. */}
        {part(PART.brief, 'torso', 'brief', true)}
        {occlusion(
          'c-brief',
          <>
            <ellipse cx={298} cy={241} rx={54} ry={6} opacity={0.38} />
            <ellipse cx={300} cy={291} rx={20} ry={10} opacity={0.3} />
            <path
              d="M 246 240 C 243 256 243 270 246 282"
              fill="none"
              strokeWidth={10}
              opacity={0.18}
            />
            <path
              d="M 350 240 C 352 258 352 272 350 282"
              fill="none"
              strokeWidth={12}
              opacity={0.25}
            />
          </>,
        )}

        {/* Upper torso (hard upper torso under its fabric cover). */}
        {part(PART.torso, 'torso', 'torso', true)}
        {occlusion(
          'c-torso',
          <>
            <ellipse cx={298} cy={100} rx={38} ry={10} opacity={0.5} />
            <path
              d="M 252 158 C 268 168 290 170 306 166"
              fill="none"
              strokeWidth={10}
              opacity={0.12}
            />
            <path
              d="M 252 134 C 250 160 246 186 243 220"
              fill="none"
              strokeWidth={15}
              opacity={0.4}
            />
            <path
              d="M 366 124 C 358 160 351 196 347 232"
              fill="none"
              strokeWidth={18}
              opacity={0.24}
            />
            <ellipse cx={308} cy={210} rx={33} ry={4.5} opacity={0.36} />
            <ellipse cx={298} cy={231} rx={52} ry={5} opacity={0.3} />
          </>,
        )}
        {ring(RING.waist, 'waist')}

        {/* Seams with stitch lines. */}
        <g fill="none" strokeLinecap="round">
          <g stroke={suit('shade')} strokeOpacity={0.55} strokeWidth={1}>
            {SEAMS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g
            stroke={suit('shade')}
            strokeOpacity={0.45}
            strokeWidth={0.7}
            strokeDasharray="1.6 2.6"
            transform="translate(2.2 1.4)"
          >
            {SEAMS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>

        {/* Chest display & control module. */}
        <g>
          <path d={DCM.body} fill={url('form')} />
          <path
            d={DCM.body}
            fill="none"
            stroke={suit('shade')}
            strokeOpacity={0.7}
            strokeWidth={0.8}
          />
          <path d={DCM.top} fill={suit('hi')} opacity={0.85} />
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
            r={DCM.dial.r - 2.5}
            fill="none"
            stroke={suit('hw-dark')}
            strokeOpacity={0.6}
            strokeWidth={0.8}
          />
          <path
            d={`M ${DCM.dial.cx} ${DCM.dial.cy} L ${DCM.dial.cx + 3} ${DCM.dial.cy - 3.5}`}
            stroke={suit('hw-dark')}
            strokeWidth={1}
            strokeLinecap="round"
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
        </g>

        {/* Near arm (in front of the torso). */}
        {part(PART.armNear, 'form', 'armNear')}
        {occlusion(
          'c-armNear',
          <>
            <ellipse cx={221} cy={135} rx={28} ry={5} opacity={0.24} />
            <path
              d="M 247 146 C 244 182 238 222 232 270"
              fill="none"
              strokeWidth={8}
              opacity={0.2}
            />
          </>,
        )}
        {foldSet('c-armNear', CREASES.armNear, 0.6)}
        {foldSet('c-armNear', FOLDS.elbowNear)}
        {ring(RING.shoulderNear, 'shoulderNear')}
        <ellipse
          cx={213}
          cy={112}
          rx={9}
          ry={5}
          fill={url('sheen')}
          transform="rotate(-25 213 112)"
        />
        {ring(RING.wristNear, 'wristNear')}
        {part(PART.gloveNear, 'glove', 'gloveNear')}
        {part(PART.thumbNear, 'glove', 'thumbNear')}
        <g
          fill="none"
          stroke={suit('deep')}
          strokeOpacity={0.22}
          strokeWidth={1}
          strokeLinecap="round"
        >
          <path d="M 204 298 C 205 306 207 313 209 318" />
          <path d="M 213 298 C 214 306 215 313 216 319" />
          <path d="M 227 297 C 229 293 229 287 227 282" />
        </g>

        {/* Helmet: neck ring, shell, lamps, visor frame, visor glass and reflections. */}
        {ring(RING.neck, 'neck')}
        <path d={PART.helmet} fill={url('helmet')} />
        {occlusion(
          'c-helmet',
          <>
            <path d={VISOR_FRAME} fill="none" strokeWidth={6} opacity={0.22} />
            <ellipse cx={296} cy={95} rx={30} ry={6} opacity={0.3} />
          </>,
        )}
        <ellipse
          cx={279}
          cy={30}
          rx={12}
          ry={6}
          fill={url('sheen')}
          transform="rotate(-32 279 30)"
        />
        <path d={LAMPS.far} fill={url('hw')} />
        <path d={LAMPS.near} fill={url('hw')} />
        <path d={LAMPS.nearLens} fill={suit('lens')} />
        <path d="M 257 41 L 263 41 L 262.5 44 L 257 44 Z" fill={suit('sheen')} opacity={0.25} />
        <path d={VISOR_FRAME} fill={url('hw')} />
        <path d={VISOR} fill={url('visor')} />
        <path d={VISOR_REFLECTION.band} fill={url('visorBand')} />
        <path d={VISOR_REFLECTION.glint} fill={suit('sheen')} opacity={0.22} />
        <path
          d={VISOR_REFLECTION.rim}
          fill="none"
          stroke={suit('sheen')}
          strokeOpacity={0.14}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/** Static suit layer — memoised so React never touches it after mount. */
export const SuitArt = memo(SuitArtImpl);
