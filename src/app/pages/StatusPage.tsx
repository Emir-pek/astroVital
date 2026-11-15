import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthStore } from '@core/store';
import type { BodyRegionId } from '@core/types';
import { AlertPanel, BodyMap, RegionSheet, VitalsPanel } from '@modules/visualization';
import { PageHeader } from './PageHeader';
import { placeOver, type SheetPlace } from './sheetPlacement';

/**
 * Route "/": the status of the signed-in astronaut at a glance (ADR-036). Figure with region
 * labels on the left (≈ 60 %), the right column (≈ 38 %) holds the alert card (only while there
 * is an alert to act on) above the compact vitals rail. The shell shows no strip row on this page,
 * so at 1180 × 820 the figure and all ten labels stay in view with or without an alert; the rail
 * scrolls inside its own card when the alert card takes room.
 */
export function StatusPage() {
  const { t } = useTranslation();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  const [region, setRegion] = useState<BodyRegionId | null>(null);
  const [place, setPlace] = useState<SheetPlace | null>(null);
  const rightColumn = useRef<HTMLDivElement>(null);

  // The region sheet takes exactly the place of the right column (alert card + vitals rail):
  // below the page header and the top bar, above the disclaimer row. The figure, the label just
  // pressed and the whole top bar (Emergency above all) stay visible and usable beside it.
  const measureColumn = useCallback(() => {
    const column = rightColumn.current;
    if (!column) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    setPlace(placeOver(column.getBoundingClientRect(), viewport));
  }, []);

  useEffect(() => {
    if (region === null) return;
    window.addEventListener('resize', measureColumn);
    return () => window.removeEventListener('resize', measureColumn);
  }, [region, measureColumn]);

  // Same label again closes the sheet; another label switches it (the sheet is non-modal).
  const selectRegion = (id: BodyRegionId) => {
    measureColumn();
    setRegion((current) => (current === id ? null : id));
  };

  return (
    <>
      <PageHeader title={t('pages.status.title')} />
      {crewId && (
        <div className="grid flex-1 grid-cols-[minmax(0,60fr)_minmax(0,38fr)] gap-section">
          <BodyMap crewId={crewId} selectedRegion={region} onRegionSelect={selectRegion} />
          {/* The column takes the height the figure pane sets; it never sizes the page. */}
          <div ref={rightColumn} className="flex min-h-0 flex-col gap-touch-gap [contain:size]">
            <div className="flex min-h-0 shrink flex-col overflow-y-auto empty:hidden">
              <AlertPanel crewId={crewId} />
            </div>
            <div className="min-h-[200px] flex-1">
              <VitalsPanel crewId={crewId} />
            </div>
          </div>
          <RegionSheet
            crewId={crewId}
            region={region}
            width={place?.width}
            bounds={place?.bounds}
            onClose={() => setRegion(null)}
          />
        </div>
      )}
    </>
  );
}
