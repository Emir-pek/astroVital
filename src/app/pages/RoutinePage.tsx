import { useTranslation } from 'react-i18next';
import { MissionBoard, ReminderCenter } from '@modules/routine';
import { PageHeader } from './PageHeader';

/** Route "/routine": the measurement tasks of the day and the health missions. */
export function RoutinePage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.routine.title')} subtitle={t('pages.routine.subtitle')} />
      <div className="grid grid-cols-2 gap-6">
        <ReminderCenter scope="today" />
        <MissionBoard />
      </div>
    </>
  );
}
