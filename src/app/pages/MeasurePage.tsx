import { useTranslation } from 'react-i18next';
import { useHealthStore } from '@core/store';
import { MeasurementForm, QuickLogPanel } from '@modules/intake';
import { PageHeader } from './PageHeader';

/** Route "/measure": enter a measurement for the signed-in astronaut. */
export function MeasurePage() {
  const { t } = useTranslation();
  const crewId = useHealthStore((s) => s.selectedCrewId);
  return (
    <>
      <PageHeader title={t('pages.measure.title')} subtitle={t('pages.measure.subtitle')} />
      {crewId && (
        <div className="grid grid-cols-2 gap-6">
          <QuickLogPanel crewId={crewId} />
          <MeasurementForm crewId={crewId} />
        </div>
      )}
    </>
  );
}
