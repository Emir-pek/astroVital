import { useTranslation } from 'react-i18next';
import { AlertCenter } from '@modules/assessment';
import { ReminderCenter } from '@modules/routine';
import { CrewOverview } from '@modules/visualization';
import { PageHeader } from './PageHeader';

/** `/` — CrewOverview + AlertCenter (summary) + ReminderCenter (today). */
export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.dashboard.title')} subtitle={t('pages.dashboard.subtitle')} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrewOverview />
        </div>
        <div className="flex flex-col gap-4">
          <AlertCenter compact limit={5} />
          <ReminderCenter scope="today" />
        </div>
      </div>
    </>
  );
}
