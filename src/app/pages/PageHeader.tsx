import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useHealthStore } from '@core/store';
import { AlertSummary } from '@modules/visualization';

/**
 * Page header, a two-row grid that never wraps into a jumble (1180 px, EN and TR):
 *   row 1: title ........................ status line
 *   row 2: subtitle (full width, or up to the actions) ... actions
 * When nothing needs attention, the one-line alert status ("All indicators nominal · …") sits
 * beside the short title (ADR-036); with an active alert the strip has its own row above the page
 * and this slot stays empty.
 *
 * Language never sizes the boxes (design 2026-11-15 §3.4): the right column has a fixed width
 * (status line stretched to it, actions laid out inside it), a subtitle beside actions is clamped
 * to 3 lines (always ≤ the 104 px action row) and a full-width subtitle to 1 line; clipped text
 * stays available as the element's `title`.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const crewId = useHealthStore((s) => s.selectedCrewId);
  return (
    <div className="mb-4 grid shrink-0 grid-cols-[minmax(0,1fr)_36rem] items-center gap-x-section gap-y-2">
      <h1
        title={title}
        className="col-start-1 row-start-1 min-w-0 truncate text-title leading-tight font-semibold text-text"
      >
        {title}
      </h1>
      <div className="col-start-2 row-start-1 flex min-w-0 justify-end empty:hidden *:w-full">
        {crewId && <AlertSummary crewId={crewId} />}
      </div>
      {subtitle && (
        <p
          title={subtitle}
          className={clsx(
            'row-start-2 min-w-0 text-body text-text-2',
            actions ? 'col-start-1 line-clamp-3' : 'col-span-2 truncate',
          )}
        >
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-end gap-touch-gap">
          {actions}
        </div>
      )}
    </div>
  );
}
