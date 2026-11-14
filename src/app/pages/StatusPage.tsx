import { useTranslation } from 'react-i18next';
import { PageHeader } from './PageHeader';

/** Route "/": the status of the signed-in astronaut at a glance. */
export function StatusPage() {
  const { t } = useTranslation();
  return <PageHeader title={t('pages.status.title')} subtitle={t('pages.status.subtitle')} />;
}
