import { clsx } from 'clsx';
import { Clock } from 'lucide-react';
import { ArcGauge, type ArcGaugeProps } from './ArcGauge';
import { StatusBadge } from './StatusBadge';
import { STATUS_STYLE, type DisplayStatus } from './statusStyle';

export interface VitalRowProps {
  label: string;
  value: string;
  unit: string;
  status: DisplayStatus;
  statusLabel: string;
  direction?: 'up' | 'down' | null;
  directionLabel?: string;
  /** Data age. Shown when the reading is stale (with the re-measure hint), spoken otherwise. */
  measuredText: string;
  /** Mini gauge; its active segment takes the row's status. */
  gauge?: Omit<ArcGaugeProps, 'status'>;
}

/**
 * One vital sign as a compact row of the Status-screen rail (spec §7.1, ADR-036):
 * label + status badge on top, large monospace value + unit and a mini arc gauge below.
 * The row has no surface or horizontal padding of its own — the rail (a Panel) supplies both.
 */
export function VitalRow({
  label,
  value,
  unit,
  status,
  statusLabel,
  direction,
  directionLabel,
  measuredText,
  gauge,
}: VitalRowProps) {
  const stale = status === 'stale';
  const showArrow = direction != null && (status === 'caution' || status === 'warning');
  return (
    <div
      data-status={status}
      className="relative flex h-full flex-col justify-center gap-0.5 py-1.5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-label text-text-2">{label}</span>
        <StatusBadge status={status} label={statusLabel} size="sm" className="shrink-0" />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className={clsx('flex min-w-0 items-baseline gap-2', stale && 'opacity-50')}>
          <span className="font-mono text-value leading-none text-text">{value}</span>
          <span className="text-label text-text-2">{unit}</span>
          {showArrow && (
            <span
              aria-label={directionLabel}
              className={clsx('text-headline leading-none', STATUS_STYLE[status].textClass)}
            >
              {direction === 'up' ? '▲' : '▼'}
            </span>
          )}
        </div>
        {gauge && (
          <div className={clsx(stale && 'opacity-50')}>
            <ArcGauge {...gauge} status={status} />
          </div>
        )}
      </div>
      {stale ? (
        // Always two lines tall (clamped, full text in `title`): the row is the same height in
        // every language, and the rail reserves room for it (no overlap with the next row).
        <p title={measuredText} className="flex h-12 items-start gap-2 text-label text-text-2">
          <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span className="line-clamp-2 min-w-0">{measuredText}</span>
        </p>
      ) : (
        <span className="sr-only">{measuredText}</span>
      )}
    </div>
  );
}
