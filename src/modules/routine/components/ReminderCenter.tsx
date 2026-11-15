import {
  AlarmClockCheck,
  BellRing,
  CalendarClock,
  CircleCheck,
  CircleX,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, EmptyState, Tile } from '@core/ui';
import { useReminders, type ReminderStatus } from '../hooks/useReminders';

export interface ReminderCenterProps {
  /** 'today' = dashboard widget; 'all' = full list. Both show today's tasks for now. */
  scope?: 'today' | 'all';
  /** Crew member to show; default = the signed-in astronaut. */
  crewId?: string;
}

/** Icon per status — status is always icon + text, never colour alone ('late' ≠ 'done'). */
export const REMINDER_STATUS_ICON: Record<ReminderStatus, LucideIcon> = {
  upcoming: Clock,
  due: BellRing,
  done: CircleCheck,
  late: AlarmClockCheck,
  missed: CircleX,
};

/** "HH:MM" (UTC) of an ISO timestamp. */
const hhmm = (iso: string): string => iso.slice(11, 16);

/**
 * Today's routine of one astronaut (ADR-041). WORKING-PLAIN: logic complete, look and layout belong
 * to visualization (ADR-032, docs/HANDOFF_ENGINEER4.md).
 */
export function ReminderCenter({ scope = 'today', crewId }: ReminderCenterProps) {
  const { t } = useTranslation();
  const { reminders, completeTask } = useReminders(crewId);

  return (
    <Card title={t('routine.reminders.title')} data-scope={scope}>
      {reminders.length === 0 ? (
        <EmptyState
          icon={<CalendarClock aria-hidden="true" className="size-6" />}
          title={t('routine.reminders.empty')}
        />
      ) : (
        <ul className="flex flex-col gap-touch-gap">
          {reminders.map((r) => {
            const Icon = REMINDER_STATUS_ICON[r.status];
            const manualOpen = !r.template.metric && (r.status === 'due' || r.status === 'missed');
            return (
              <Tile
                as="li"
                key={r.id}
                data-status={r.status}
                className="flex items-center justify-between gap-touch-gap text-label"
              >
                <span>
                  {t('routine.reminders.at', { time: hhmm(r.dueAt) })} · {t(r.template.taskKey)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-6" />
                  {t(`routine.reminders.status.${r.status}`)}
                </span>
                {manualOpen && (
                  <Button variant="secondary" onClick={() => completeTask(r.crewId, r.template.id)}>
                    {t('routine.reminders.markDone')}
                  </Button>
                )}
              </Tile>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
