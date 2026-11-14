import { useTranslation } from 'react-i18next';
import { AlertCenter } from '@modules/assessment';
import { PageHeader } from './PageHeader';

/** `/alerts` — full AlertCenter. */
export function AlertsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.alerts.title')} subtitle={t('pages.alerts.subtitle')} />
      <AlertCenter />
    </>
  );
}
