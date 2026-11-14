import { clsx } from 'clsx';
import type { BodyRegionId } from '@core/types';
import { STATUS_STYLE } from '@core/ui';
import type { RegionView } from './BodyMap';

export interface RegionChipsProps {
  regions: RegionView[];
  selectedRegion: BodyRegionId | null;
  onRegionSelect: (id: BodyRegionId) => void;
}

/**
 * The accessible way into every region (spec §7.1): 2 rows × 5 glove-sized chips below the
 * figure, each with status icon + region name (+ status text for screen readers).
 */
export function RegionChips({ regions, selectedRegion, onRegionSelect }: RegionChipsProps) {
  return (
    <ul className="grid grid-cols-5 gap-touch-gap">
      {regions.map((r) => {
        const { icon: Icon, textClass } = STATUS_STYLE[r.status];
        const selected = selectedRegion === r.id;
        return (
          <li key={r.id}>
            <button
              type="button"
              data-region={r.id}
              data-status={r.status}
              aria-pressed={selected}
              onClick={() => onRegionSelect(r.id)}
              className={clsx(
                'flex min-h-touch min-w-touch w-full flex-col items-center justify-center gap-1',
                'rounded-button bg-raised px-2 text-center text-label leading-tight text-text',
                'transition-colors duration-300 ease-out',
                // Ring, not outline: the global :focus-visible outline must stay intact.
                selected && 'ring-3 ring-accent',
              )}
            >
              <Icon aria-hidden="true" className={clsx('size-6 shrink-0', textClass)} />
              <span>{r.label}</span>
              <span className="sr-only">: {r.statusLabel}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
