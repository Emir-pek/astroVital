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
        <Card className="mb-section border-2 border-caution">
          <p className="text-body font-semibold text-text">{t('pages.emergency.autonomous')}</p>
        </Card>
      )}
      <ol className="flex flex-col gap-section">
        {CHAIN.map((step, index) => (
          <li key={step}>
            <Card>
              <div className="flex items-start gap-6">
                <span
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center rounded-pill bg-raised font-mono text-headline text-text"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
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
