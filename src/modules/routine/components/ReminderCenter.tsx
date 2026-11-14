import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PlaceholderNotice } from '@core/ui';
import { useReminders } from '../hooks/useReminders';

export interface ReminderCenterProps {
  /** 'today' = dashboard widget; 'all' = full list. */
  scope?: 'today' | 'all';
}

/** STUB list of today's routine. TODO(Engineer 1, P1): render useReminders() with status chips. */
export function ReminderCenter({ scope = 'today' }: ReminderCenterProps) {
  const { t } = useTranslation();
  const { reminders } = useReminders();

  return (
    <Card title={t('routine.reminders.title')} data-scope={scope}>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 1' })} />
      {reminders.length === 0 ? (
        <EmptyState
          icon={<CalendarClock aria-hidden="true" className="size-6" />}
          title={t('routine.reminders.empty')}
        />
      ) : (
        <ul>
          {reminders.map((r) => (
            <li key={`${r.template.id}-${r.dueAt}`}>{t(r.template.taskKey)}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
