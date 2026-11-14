import { useTranslation } from 'react-i18next';
import { MissionBoard } from '@modules/routine';
import { PageHeader } from './PageHeader';

/** `/mission` — MissionBoard (missions, badges, team score). */
export function MissionPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.mission.title')} subtitle={t('pages.mission.subtitle')} />
      <MissionBoard />
    </>
  );
}
