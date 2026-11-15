import { motion, useReducedMotion } from 'framer-motion';
import { useId, type ReactNode } from 'react';
import type { BodyRegionId } from '@core/types';
import { STATUS_COLOR_VAR, type DisplayStatus } from '@core/ui';
import {
  FIGURE_BOX,
  HALO_OUTLINE,
  INNER_ORDER,
  REGION_SHAPES,
  SILHOUETTE,
  type InnerRegionId,
} from './geometry';
import { FIGURE_VIEWBOX_ATTR } from './layout';
import { renderShape, safeId, stop } from './renderShape';
import { SuitArt } from './SuitArt';

/*
 * Hand-drawn astronaut (spec §8, ADR-036), three stacked SVG layers that share one viewBox and
 * scale with their box:
 *
 *   1. halo  — the whole_body region, behind the suit: a thin contour a few px outside the
 *              silhouette, with a dark gap. The only thing that breathes (opacity 0.85 ↔ 1 over
 *              4.5 s) and only while nominal;
 *   2. suit  — the static matte-white illustration (SuitArt); its blur filters render once;
 *   3. marks — inner regions. A nominal, stale or empty region draws nothing: the labels beside
 *              the figure carry every status. Advisory/caution/warning regions get a status fill
 *              (vessels: filled tracts along the limbs) clipped to the silhouette plus a dark
 *              keyline (navy on the white suit ≈ 13:1, so the area reads at ≥ 3:1 even where the
 *              status colour itself does not).
 *
 * Selection is shown by the label and its accent leader line (BodyMap); here it only dims the
 * marks of the other regions.
 */

/** Breathing period of the nominal halo; mirrors --av-breath (4.5 s) in tokens.css. */
const BREATH_SECONDS = 4.5;

type AlertStatus = 'advisory' | 'caution' | 'warning';
const isAlert = (s: DisplayStatus): s is AlertStatus =>
  s === 'advisory' || s === 'caution' || s === 'warning';

/** Opacity of the marks of regions that are not selected while another one is. */
const DIMMED = 0.3;
const ALERTS: readonly AlertStatus[] = ['advisory', 'caution', 'warning'];
/** Dark keyline around status marks: the page background tone. */
const KEYLINE = 'var(--av-bg)';

const BREATH = {
  animate: { opacity: [0.85, 1] },
  transition: {
    duration: BREATH_SECONDS,
    repeat: Infinity,
    repeatType: 'mirror' as const,
    ease: 'easeInOut' as const,
  },
};

interface LayerProps {
  breathing: boolean;
  children: ReactNode;
}

/** One full-size SVG layer; a breathing layer animates its own opacity (compositor-friendly). */
function Layer({ breathing, children }: LayerProps) {
  const common = {
    viewBox: FIGURE_VIEWBOX_ATTR,
    'aria-hidden': true,
    focusable: false,
    className: 'pointer-events-none absolute inset-0 size-full',
  } as const;
  return breathing ? (
    <motion.svg
      {...common}
      data-breathing="true"
      style={{ willChange: 'opacity' }}
      initial={{ opacity: 0.85 }}
      animate={BREATH.animate}
      transition={BREATH.transition}
    >
      {children}
    </motion.svg>
  ) : (
    <svg {...common}>{children}</svg>
  );
}

interface InnerRegionProps {
  id: InnerRegionId;
  status: DisplayStatus;
  dimmed: boolean;
  uid: string;
}

/** Status mark of one inner region, clipped to the suit. Nothing at all unless it is an alert. */
function InnerRegion({ id, status, dimmed, uid }: InnerRegionProps) {
  const spec = REGION_SHAPES[id];
  let mark: ReactNode = null;
  if (isAlert(status)) {
    // Filled area + dark keyline. Vessels are filled tracts too, so no mark ever looks like a
    // leader line.
    mark = (
      <>
        <g fill={`url(#${uid}-fill-${status})`}>
          {spec.shapes.map((s, i) => renderShape(s, `f${i}`))}
        </g>
        <g fill="none" stroke={KEYLINE} strokeWidth={1.3} strokeOpacity={0.85}>
          {spec.shapes.map((s, i) => renderShape(s, `k${i}`))}
        </g>
      </>
    );
  }
  return (
    <g data-region={id} data-status={status} opacity={dimmed ? DIMMED : undefined}>
      {mark && <g clipPath={`url(#${uid}-suit)`}>{mark}</g>}
    </g>
  );
}

interface HaloProps {
  status: DisplayStatus;
  dimmed: boolean;
  filter: string;
}

/**
 * whole_body: a thin contour line that follows the silhouette a few px outside it, separated from
 * the suit by a dark gap (drawn behind the suit, so only the outer part of every stroke shows), with
 * a faint glow. Mint while nominal, a clear steady status colour otherwise; stale or missing data
 * draws nothing (old data never looks like a health state).
 */
function Halo({ status, dimmed, filter }: HaloProps) {
  const lit = status === 'nominal' || isAlert(status);
  const nominal = status === 'nominal';
  const outline = HALO_OUTLINE.map((d) => <path key={d} d={d} />);
  return (
    <g data-region="whole_body" data-status={status} opacity={dimmed ? DIMMED : undefined}>
      {lit && (
        <g fill="none" strokeLinejoin="round">
          <g
            filter={`url(#${filter})`}
            stroke={STATUS_COLOR_VAR[status]}
            strokeWidth={nominal ? 14 : 20}
            opacity={nominal ? 0.14 : 0.4}
          >
            {outline}
          </g>
          <g
            stroke={STATUS_COLOR_VAR[status]}
            strokeWidth={nominal ? 8 : 12}
            opacity={nominal ? 0.5 : 1}
          >
            {outline}
          </g>
          <g stroke="var(--av-bg)" strokeWidth={nominal ? 5.6 : 6}>
            {outline}
          </g>
        </g>
      )}
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
  const haloStatus = regions.whole_body;
  const dimmed = (id: BodyRegionId) => selected !== null && selected !== id;

  return (
    <div className="relative size-full" aria-hidden="true">
      <Layer breathing={haloStatus === 'nominal' && !reduceMotion}>
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
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <Halo status={haloStatus} dimmed={dimmed('whole_body')} filter={`${uid}-halo`} />
      </Layer>

      <SuitArt uid={`${uid}-suit-art`} />

      <Layer breathing={false}>
        <defs>
          <clipPath id={`${uid}-suit`}>
            {SILHOUETTE.map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
          {/* Status fill: strong in the middle, lighter towards the keyline (no flat sticker). */}
          {ALERTS.map((a) => (
            <radialGradient key={a} id={`${uid}-fill-${a}`}>
              {stop(0, STATUS_COLOR_VAR[a], 0.92)}
              {stop(0.62, STATUS_COLOR_VAR[a], 0.7)}
              {stop(1, STATUS_COLOR_VAR[a], 0.38)}
            </radialGradient>
          ))}
        </defs>
        {INNER_ORDER.map((id) => (
          <InnerRegion key={id} id={id} status={regions[id]} dimmed={dimmed(id)} uid={uid} />
        ))}
      </Layer>
    </div>
  );
}
