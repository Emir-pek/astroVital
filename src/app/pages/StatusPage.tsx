import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthStore } from '@core/store';
import type { BodyRegionId } from '@core/types';
import { Card } from '@core/ui';
import { BodyMap, RegionSheet, VitalsPanel } from '@modules/visualization';
import { PageHeader } from './PageHeader';

/** Route "/": the status of the signed-in astronaut at a glance (figure + value cards). */
export function StatusPage() {
  const { t } = useTranslation();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  const [region, setRegion] = useState<BodyRegionId | null>(null);

  return (
    <>
      <PageHeader title={t('pages.status.title')} subtitle={t('pages.status.subtitle')} />
      {crewId && (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
          <Card>
            <BodyMap crewId={crewId} selectedRegion={region} onRegionSelect={setRegion} />
          </Card>
          <VitalsPanel crewId={crewId} />
          <RegionSheet crewId={crewId} region={region} onClose={() => setRegion(null)} />
        </div>
      )}
    </>
  );
}
