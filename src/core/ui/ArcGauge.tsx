import type { Status } from '@core/types';
import { arcPath, gaugeSegments, polarPoint, segmentIndexAt, valueToAngle } from './arcMath';
import { STATUS_COLOR_VAR, type DisplayStatus } from './statusStyle';

export interface GaugeBand {
  from: number;
  to: number;
  status: Exclude<Status, 'nominal'>;
}

export interface ArcGaugeProps {
  value: number;
  min: number;
  max: number;
  /** Non-nominal threshold bands; the gaps between them are the nominal range. */
  bands: GaugeBand[];
  /** Already-translated accessible label. */
  label: string;
  /** Already-translated "off scale" text, announced and marked when the value is outside min..max. */
  offScaleLabel?: string;
  /**
   * Status of the reading (the assessment's verdict). It colours the segment the value sits in,
   * so the gauge can never disagree with the status badge next to it. Without it the segment
   * takes its own threshold status.
   */
  status?: DisplayStatus;
}

// Mini arc: 96 × 44 px. The arc spans x 15..81; the off-scale markers sit outside its ends.
const W = 96;
const H = 44;
const CX = 48;
const CY = 38.5;
const R = 33;
const STROKE = 5;
/** Angular gap between neighbouring segments, so thresholds show without colour (degrees). */
const GAP = 3;

/**
 * Thin half-circle mini gauge (spec §7.1, ADR-036): a neutral track split at the thresholds,
 * only the segment the current value sits in is coloured with its status, and a value dot.
 */
export function ArcGauge({ value, min, max, bands, label, offScaleLabel, status }: ArcGaugeProps) {
  const dot = polarPoint(CX, CY, R, valueToAngle(value, min, max));
  // NASA-STD-3001 F.4.3.1.5: a value beyond the scale must say so, never sit silently at the end.
  const offScale = value < min ? 'low' : value > max ? 'high' : null;
  const ariaLabel = offScale && offScaleLabel ? `${label} · ${offScaleLabel}` : label;
  const segments = gaugeSegments(min, max, bands);
  const active = segmentIndexAt(segments, value);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={ariaLabel}
      data-off-scale={offScale ?? undefined}
      className="shrink-0"
    >
      {segments.map((s, i) => {
        const from = valueToAngle(s.from, min, max);
        const to = valueToAngle(s.to, min, max);
        const start = i === 0 ? from : from - GAP / 2;
        const end = i === segments.length - 1 ? to : to + GAP / 2;
        if (start <= end) return null;
        const isActive = i === active;
        return (
          <path
            key={`${s.status}-${s.from}-${s.to}`}
            data-segment={s.status}
            data-active={isActive || undefined}
            d={arcPath(CX, CY, R, start, end)}
            fill="none"
            stroke={isActive ? STATUS_COLOR_VAR[status ?? s.status] : 'var(--av-text-3)'}
            strokeOpacity={isActive ? 1 : 0.28}
            strokeWidth={STROKE}
          />
        );
      })}
      <circle
        cx={dot.x}
        cy={dot.y}
        r={4.5}
        fill="var(--av-text)"
        stroke="var(--av-surface)"
        strokeWidth={2}
      />
      {offScale && (
        <text
          x={offScale === 'low' ? 6 : W - 6}
          y={CY + 4.5}
          textAnchor="middle"
          fontSize={12}
          fill="var(--av-text)"
        >
          {offScale === 'low' ? '◀' : '▶'}
        </text>
      )}
    </svg>
  );
}
