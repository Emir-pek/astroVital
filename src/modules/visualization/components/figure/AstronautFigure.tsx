import { motion, useReducedMotion } from 'framer-motion';
import { useId, type ReactNode } from 'react';
import type { BodyRegionId } from '@core/types';
import { STATUS_COLOR_VAR, type DisplayStatus } from '@core/ui';
import {
  FIGURE_BOX,
  FIGURE_OFFSET_Y,
  HALO_OUTLINE,
  INNER_ORDER,
  REGION_SHAPES,
  SILHOUETTE,
  type InnerRegionId,
} from './geometry';
import { STAGE } from './hitAreas';
import { renderShape, safeId, stop, suit } from './renderShape';
import { SuitArt } from './SuitArt';

/*
 * Hand-drawn astronaut (spec §8), built as four stacked SVG layers on the same 584 × 520 stage:
 *
 *   1. halo      — the whole_body region, behind the suit (only its outer rim shows);
 *   2. suit      — the static illustration (SuitArt); its blur filters render once;
 *   3. steady    — region glows that do not move (advisory/caution/warning/stale/none);
 *   4. breathing — nominal region glows; the whole layer fades 0.85 ↔ 1 over 4.5 s.
 *
 * Breathing is a layer-level opacity animation (compositor-only, no repaint of the SVG content)
 * instead of animating every glow inside one SVG. Inner glows are radial gradients and stacked
 * strokes — no filters — so nothing animated is ever re-blurred. The halo uses one static blur
 * and, when nominal, breathes the same way at the layer level.
 */

/** Breathing period for nominal regions; mirrors --av-breath (4.5 s) in tokens.css. */
const BREATH_SECONDS = 4.5;

type LitStatus = Exclude<DisplayStatus, 'stale' | 'none'>;
const LIT: readonly LitStatus[] = ['nominal', 'advisory', 'caution', 'warning'];

/** Glow strength per status: nominal is a faint hint, problems glow clearly (and steadily). */
const GLOW_OPACITY: Record<LitStatus, number> = {
  nominal: 0.36,
  advisory: 0.85,
  caution: 0.95,
  warning: 0.95,
};

const BREATH = {
  animate: { opacity: [0.85, 1] },
  transition: {
    duration: BREATH_SECONDS,
    repeat: Infinity,
    repeatType: 'mirror' as const,
    ease: 'easeInOut' as const,
  },
};

const isLit = (s: DisplayStatus): s is LitStatus => s !== 'stale' && s !== 'none';

interface LayerProps {
  breathing: boolean;
  children: ReactNode;
}

/** One full-stage SVG layer; a breathing layer animates its own opacity (compositor-friendly). */
function Layer({ breathing, children }: LayerProps) {
  const common = {
    viewBox: `0 0 ${STAGE.width} ${STAGE.height}`,
    width: STAGE.width,
    height: STAGE.height,
    'aria-hidden': true,
    focusable: false,
    className: 'pointer-events-none absolute inset-0',
  } as const;
  const content = <g transform={`translate(0 ${FIGURE_OFFSET_Y})`}>{children}</g>;
  return breathing ? (
    <motion.svg
      {...common}
      data-breathing="true"
      style={{ willChange: 'opacity' }}
      initial={{ opacity: 0.85 }}
      animate={BREATH.animate}
      transition={BREATH.transition}
    >
      {content}
    </motion.svg>
  ) : (
    <svg {...common}>{content}</svg>
  );
}

/** Outline for a region: dashed grey when there is no data, accent when selected. */
function contour(
  shapes: ReactNode[],
  status: DisplayStatus,
  selected: boolean,
  widthScale = 1,
): ReactNode {
  if (selected) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* A faint dark underlay keeps the lavender outline legible on the white suit. */}
        <g stroke={suit('deep')} strokeOpacity={0.35} strokeWidth={5 * widthScale}>
          {shapes}
        </g>
        <g
          stroke="var(--av-accent)"
          strokeWidth={3 * widthScale}
          strokeDasharray={status === 'none' ? '6 6' : undefined}
        >
          {shapes}
        </g>
      </g>
    );
  }
  if (status === 'none') {
    return (
      <g fill="none" strokeLinecap="round">
        <g stroke={suit('deep')} strokeOpacity={0.3} strokeWidth={3 * widthScale}>
          {shapes}
        </g>
        <g stroke={STATUS_COLOR_VAR.none} strokeWidth={1.6 * widthScale} strokeDasharray="6 6">
          {shapes}
        </g>
      </g>
    );
  }
  return null;
}

interface InnerRegionProps {
  id: InnerRegionId;
  status: DisplayStatus;
  selected: boolean;
  uid: string;
}

/** A light patch (or vessel line) showing through the suit fabric, clipped to the suit. */
function InnerRegion({ id, status, selected, uid }: InnerRegionProps) {
  const spec = REGION_SHAPES[id];
  const outline = spec.shapes.map((s, i) => renderShape(s, `o${i}`));

  let glow: ReactNode = null;
  if (isLit(status)) {
    const color = STATUS_COLOR_VAR[status];
    glow =
      spec.paint === 'patch' ? (
        <g opacity={GLOW_OPACITY[status]}>
          {spec.shapes.map((s, i) =>
            renderShape(s, `g${i}`, { fill: `url(#${uid}-glow-${status})` }),
          )}
        </g>
      ) : (
        // Luminous vessel: a wide faint bloom, a mid stroke and a bright thin core.
        <g fill="none" stroke={color} strokeLinecap="round" opacity={GLOW_OPACITY[status]}>
          {spec.shapes.map((s, i) =>
            renderShape(s, `b${i}`, { strokeWidth: 8, strokeOpacity: 0.16 }),
          )}
          {spec.shapes.map((s, i) =>
            renderShape(s, `m${i}`, { strokeWidth: 4, strokeOpacity: 0.32 }),
          )}
          {spec.shapes.map((s, i) => renderShape(s, `c${i}`, { strokeWidth: 1.6 }))}
        </g>
      );
  } else if (status === 'stale') {
    // Old data never looks like a health state: flat grey, low opacity, no glow.
    glow = (
      <g opacity={0.75}>
        {spec.paint === 'patch'
          ? spec.shapes.map((s, i) => renderShape(s, `s${i}`, { fill: `url(#${uid}-stale)` }))
          : spec.shapes.map((s, i) =>
              renderShape(s, `s${i}`, {
                fill: 'none',
                stroke: STATUS_COLOR_VAR.stale,
                strokeWidth: 1.6,
                strokeLinecap: 'round',
              }),
            )}
      </g>
    );
  }

  return (
    <g data-region={id} data-status={status}>
      {glow && <g clipPath={`url(#${uid}-suit)`}>{glow}</g>}
      {contour(outline, status, selected)}
    </g>
  );
}

/** Gradients + suit clip shared by the glow layers (each layer carries its own copy). */
function GlowDefs({ uid, statuses }: { uid: string; statuses: readonly LitStatus[] }) {
  return (
    <defs>
      {statuses.map((s) => (
        <radialGradient key={s} id={`${uid}-glow-${s}`}>
          {stop(0, STATUS_COLOR_VAR[s], 1)}
          {stop(0.35, STATUS_COLOR_VAR[s], 0.78)}
          {stop(0.7, STATUS_COLOR_VAR[s], 0.26)}
          {stop(1, STATUS_COLOR_VAR[s], 0)}
        </radialGradient>
      ))}
      <radialGradient id={`${uid}-stale`}>
        {stop(0, STATUS_COLOR_VAR.stale, 0.9)}
        {stop(0.7, STATUS_COLOR_VAR.stale, 0.75)}
        {stop(1, STATUS_COLOR_VAR.stale, 0)}
      </radialGradient>
      <clipPath id={`${uid}-suit`}>
        {SILHOUETTE.map((d) => (
          <path key={d} d={d} />
        ))}
      </clipPath>
    </defs>
  );
}

interface HaloProps {
  status: DisplayStatus;
  selected: boolean;
  uid: string;
}

/**
 * whole_body: a thin halo hugging the silhouette. Drawn behind the suit, so only the outer half
 * of every stroke shows — widths are doubled accordingly.
 */
function Halo({ status, selected, uid }: HaloProps) {
  const outline = HALO_OUTLINE.map((d) => <path key={d} d={d} />);
  let glow: ReactNode = null;
  if (isLit(status)) {
    glow = (
      <g
        filter={`url(#${uid}-halo)`}
        fill="none"
        stroke={STATUS_COLOR_VAR[status]}
        strokeWidth={status === 'nominal' ? 5 : 8}
        strokeLinejoin="round"
        opacity={status === 'nominal' ? 0.42 : GLOW_OPACITY[status]}
      >
        {outline}
      </g>
    );
  } else if (status === 'stale') {
    glow = (
      <g fill="none" stroke={STATUS_COLOR_VAR.stale} strokeWidth={3} opacity={0.5}>
        {outline}
      </g>
    );
  }
  return (
    <g data-region="whole_body" data-status={status}>
      {glow}
      {contour(outline, status, selected, 2)}
    </g>
  );
}

export interface AstronautFigureProps {
  regions: Record<BodyRegionId, DisplayStatus>;
  selected: BodyRegionId | null;
}

export function AstronautFigure({ regions, selected }: AstronautFigureProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const uid = `av${safeId(useId())}`;
  const breathes = (s: DisplayStatus) => s === 'nominal' && !reduceMotion;

  const inner = (id: InnerRegionId) => (
    <InnerRegion key={id} id={id} status={regions[id]} selected={selected === id} uid={uid} />
  );
  const breathingIds = INNER_ORDER.filter((id) => breathes(regions[id]));
  const steadyIds = INNER_ORDER.filter((id) => !breathes(regions[id]));
  const haloStatus = regions.whole_body;

  return (
    <div
      className="relative"
      style={{ width: STAGE.width, height: STAGE.height }}
      aria-hidden="true"
    >
      <Layer breathing={breathes(haloStatus)}>
        <defs>
          <filter
            id={`${uid}-halo`}
            filterUnits="userSpaceOnUse"
            x={FIGURE_BOX.x}
            y={FIGURE_BOX.y}
            width={FIGURE_BOX.width}
            height={FIGURE_BOX.height}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <Halo status={haloStatus} selected={selected === 'whole_body'} uid={uid} />
      </Layer>

      <SuitArt uid={`${uid}-suit-art`} />

      <Layer breathing={false}>
        <GlowDefs uid={uid} statuses={LIT} />
        {steadyIds.map(inner)}
      </Layer>

      {breathingIds.length > 0 && (
        <Layer breathing>
          <GlowDefs uid={`${uid}b`} statuses={['nominal']} />
          {breathingIds.map((id) => (
            <InnerRegion
              key={id}
              id={id}
              status={regions[id]}
              selected={selected === id}
              uid={`${uid}b`}
            />
          ))}
        </Layer>
      )}
    </div>
  );
}
