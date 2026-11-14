import { useTranslation } from 'react-i18next';
import { useCrew, useHealthStore } from '@core/store';
import { CameraHeartRate, MeasurementForm, QuickLogPanel, UltrasoundUpload } from '@modules/intake';
import { PageHeader } from './PageHeader';

/** `/log` — QuickLogPanel, MeasurementForm, CameraHeartRate, UltrasoundUpload. */
export function LogMeasurementPage() {
  const { t } = useTranslation();
  const crew = useCrew();
  const selected = useHealthStore((s) => s.selectedCrewId);
  const setSelectedCrew = useHealthStore((s) => s.setSelectedCrew);
  const crewId = selected ?? crew[0]?.id ?? '';

  return (
    <>
      <PageHeader
        title={t('pages.log.title')}
        subtitle={t('pages.log.subtitle')}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{t('common.crewMember')}</span>
            <select
              value={crewId}
              onChange={(e) => setSelectedCrew(e.target.value)}
              className="min-h-12 rounded-lg border border-border bg-surface-2 px-3"
            >
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <QuickLogPanel crewId={crewId} />
        <MeasurementForm crewId={crewId} />
        <CameraHeartRate crewId={crewId} />
        <UltrasoundUpload crewId={crewId} />
      </div>
    </>
  );
}
