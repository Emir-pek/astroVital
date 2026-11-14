import { useTranslation } from 'react-i18next';
import { CrewOverview } from '@modules/visualization';
import { PageHeader } from './PageHeader';

/** Route "/team": the crew roster. Never shows medical values or medical status. */
export function TeamPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.team.title')} subtitle={t('pages.team.subtitle')} />
      <CrewOverview />
    </>
  );
}
