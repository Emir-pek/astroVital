import { useTranslation } from 'react-i18next';
import { LearnPanel } from '@modules/assessment';
import { PageHeader } from './PageHeader';

/** `/learn` — LearnPanel (all metrics + 5 hazards). */
export function LearnPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.learn.title')} subtitle={t('pages.learn.subtitle')} />
      <LearnPanel />
    </>
  );
}
