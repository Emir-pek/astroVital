import { useTranslation } from 'react-i18next';
import { useActiveEnvironment } from '@core/store';
import type { Escalation } from '@core/types';
import { Card } from '@core/ui';
import { PageHeader } from './PageHeader';

const CHAIN: readonly Escalation[] = [
  'self_care',
  'crew_medical_officer',
  'flight_surgeon',
  'emergency',
];

/** Route "/emergency": the escalation chain, step by step (self-care, CMO, flight surgeon, emergency). */
export function EmergencyPage() {
  const { t } = useTranslation();
  const env = useActiveEnvironment();
  return (
    <>
      <PageHeader title={t('pages.emergency.title')} subtitle={t('pages.emergency.subtitle')} />
      {env.medicalCapability === 'autonomous' && (
        <p className="mb-6 rounded-card bg-raised p-4 text-body font-semibold text-text">
          {t('pages.emergency.autonomous')}
        </p>
      )}
      <ol className="flex flex-col gap-4">
        {CHAIN.map((step, index) => (
          <li key={step}>
            <Card>
              <div className="flex items-start gap-6">
                <span
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-headline text-text"
                >
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-headline font-semibold text-text">
                    {t(`escalation.${step}`)}
                  </h2>
                  <p className="mt-1 text-body text-text-2">{t(`pages.emergency.steps.${step}`)}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
