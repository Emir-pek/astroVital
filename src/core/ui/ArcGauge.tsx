import type { Status } from '@core/types';
import { arcPath, polarPoint, valueToAngle } from './arcMath';
import { STATUS_COLOR_VAR } from './statusStyle';

export interface GaugeBand {
  from: number;
  to: number;
  status: Exclude<Status, 'nominal'>;
}

export interface ArcGaugeProps {
  value: number;
  min: number;
  max: number;
  bands: GaugeBand[];
  /** Already-translated accessible label. */
  label: string;
}

const CX = 60;
const CY = 60;
const R = 52;

/** Thin half-circle gauge with caution/warning threshold bands and a value dot. */
export function ArcGauge({ value, min, max, bands, label }: ArcGaugeProps) {
  const dot = polarPoint(CX, CY, R, valueToAngle(value, min, max));
  return (
    <svg viewBox="0 0 120 68" role="img" aria-label={label} className="w-full">
      <path
        d={arcPath(CX, CY, R, 180, 0)}
        fill="none"
        stroke="var(--av-line)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {bands.map((b) => (
        <path
          key={`${b.status}-${b.from}-${b.to}`}
          d={arcPath(CX, CY, R, valueToAngle(b.from, min, max), valueToAngle(b.to, min, max))}
          fill="none"
          stroke={STATUS_COLOR_VAR[b.status]}
          strokeWidth={6}
          opacity={0.35}
        />
      ))}
      <circle cx={dot.x} cy={dot.y} r={5} fill="var(--av-text)" />
    </svg>
  );
}
