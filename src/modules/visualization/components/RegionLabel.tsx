import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { StatusBadge, type DisplayStatus } from '@core/ui';
import type { RegionView } from './BodyMap';

/** Alert regions get a status-coloured edge so they stand out from the calm nominal labels. */
const EDGE: Partial<Record<DisplayStatus, string>> = {
  advisory: 'border-advisory',
  caution: 'border-caution',
  warning: 'border-warning',
};

export interface RegionLabelProps {
  region: RegionView;
  selected: boolean;
  ariaLabel: string;
  onSelect: () => void;
  style?: CSSProperties;
}

/**
 * One body-region label beside the figure (spec §7.1, ADR-036): the touch and keyboard target of
 * the region. Glove-sized (≥ 104 px), dark surface, region name + status (colour + icon + text).
 */
export function RegionLabel({ region, selected, ariaLabel, onSelect, style }: RegionLabelProps) {
  return (
    <button
      type="button"
      data-region={region.id}
      data-status={region.status}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      style={style}
      className={clsx(
        'card-surface flex min-h-touch min-w-touch flex-col items-start justify-center gap-2',
        'rounded-button border-2 px-3 text-left shadow-soft',
        'transition-[border-color,box-shadow] duration-300 ease-out',
        EDGE[region.status] ?? 'border-transparent',
        // Ring, not outline: the global :focus-visible outline must stay intact.
        selected && 'ring-3 ring-accent ring-offset-2 ring-offset-bg',
      )}
    >
      <span className="text-label leading-5 font-semibold text-text">{region.label}</span>
      <StatusBadge size="sm" status={region.status} label={region.statusLabel} />
    </button>
  );
}
