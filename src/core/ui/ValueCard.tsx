import { clsx } from 'clsx';
import { Clock } from 'lucide-react';
import { ArcGauge, type ArcGaugeProps } from './ArcGauge';
import { StatusBadge } from './StatusBadge';
import { STATUS_STYLE, type DisplayStatus } from './statusStyle';

export interface ValueCardProps {
  label: string;
  value: string;
  unit: string;
  status: DisplayStatus;
  statusLabel: string;
  direction?: 'up' | 'down' | null;
  directionLabel?: string;
  measuredText: string;
  gauge?: ArcGaugeProps;
}

/** One vital sign: value, unit, status (colour + icon + text), optional gauge and freshness line. */
export function ValueCard({
  label,
  value,
  unit,
  status,
  statusLabel,
  direction,
  directionLabel,
  measuredText,
  gauge,
}: ValueCardProps) {
  const stale = status === 'stale';
  const showArrow = direction != null && (status === 'caution' || status === 'warning');
  return (
    <div
      data-status={status}
      className="card-surface flex flex-col gap-3 rounded-card p-4 shadow-soft"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-text-2">{label}</span>
        <StatusBadge status={status} label={statusLabel} size="sm" />
      </div>
      <div className={clsx('flex flex-col gap-2', stale && 'opacity-50')}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-value">{value}</span>
          <span className="text-label text-text-2">{unit}</span>
          {showArrow && (
            <span
              aria-label={directionLabel}
              className={clsx('text-value', STATUS_STYLE[status].textClass)}
            >
              {direction === 'up' ? '▲' : '▼'}
            </span>
          )}
        </div>
        {gauge && <ArcGauge {...gauge} />}
      </div>
      <p className="flex items-center gap-2 text-label text-text-2">
        {stale && <Clock aria-hidden="true" className="size-5 shrink-0" />}
        {measuredText}
      </p>
    </div>
  );
}
