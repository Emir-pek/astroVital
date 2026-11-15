import { useTranslation } from 'react-i18next';
import { BODY_REGIONS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { Sheet, type SheetBounds } from '@core/ui';
import { RegionDetailPanel } from './RegionDetailPanel';

export interface RegionSheetProps {
  crewId: string;
  region: BodyRegionId | null;
  onClose: () => void;
  /**
   * Sheet width in px. The Status screen passes the width of its vitals rail, so the sheet covers
   * only the rail and the figure with all ten region labels stays in view (ADR-036).
   */
  width?: number;
  /**
   * Where the sheet sits (viewport px). The Status screen passes the box of its right column, so
   * the sheet stays below the top bar (Emergency always visible) and above the disclaimer row.
   */
  bounds?: SheetBounds;
}

/**
 * Side sheet with the Learn / detail content of the selected body region. Non-modal with a clear
 * backdrop: the figure, the selected label and its accent leader line stay readable AND usable
 * beside it — another label switches the region, the top bar keeps working.
 */
export function RegionSheet({ crewId, region, onClose, width, bounds }: RegionSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet
      open={region !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={region ? t(BODY_REGIONS[region].labelKey) : t('visualization.regionDetail.title')}
      closeLabel={t('common.close')}
      width={width}
      bounds={bounds}
      backdrop="clear"
    >
      {region && <RegionDetailPanel crewId={crewId} region={region} />}
    </Sheet>
  );
}
