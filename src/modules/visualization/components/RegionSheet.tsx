import { useTranslation } from 'react-i18next';
import { BODY_REGIONS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { Sheet } from '@core/ui';
import { RegionDetailPanel } from './RegionDetailPanel';

export interface RegionSheetProps {
  crewId: string;
  region: BodyRegionId | null;
  onClose: () => void;
}

/** Side sheet with the Learn / detail content of the selected body region. */
export function RegionSheet({ crewId, region, onClose }: RegionSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet
      open={region !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={region ? t(BODY_REGIONS[region].labelKey) : t('visualization.regionDetail.title')}
      closeLabel={t('common.close')}
    >
      {region && <RegionDetailPanel crewId={crewId} region={region} />}
    </Sheet>
  );
}
