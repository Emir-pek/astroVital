import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@core/ui';
import { useReminders } from '../hooks/useReminders';
import {
  notifyKey,
  pendingAnnouncements,
  showBrowserNotification,
} from '../services/notifications';
import { useRoutineStore } from '../store/useRoutineStore';

/**
 * Renders nothing. Announces the SIGNED-IN astronaut's reminders once when they become due and once
 * when missed: an in-app toast always, a browser notification only if the user opted in and the
 * browser granted permission. Mounted once in the app providers. Other astronauts' tasks are never
 * announced; ids already announced are remembered per crew member (persisted), so switching the
 * crew picker back and forth or reloading does not repeat them.
 */
export function ReminderNotifier() {
  const { t } = useTranslation();
  const toast = useToast();
  const { crewId, reminders } = useReminders();
  const notified = useRoutineStore((s) => (crewId ? s.notifiedIds[crewId] : undefined));
  const enabled = useRoutineStore((s) => s.notificationsEnabled);
  const markNotified = useRoutineStore((s) => s.markNotified);

  useEffect(() => {
    if (!crewId) return;
    const { due, missed } = pendingAnnouncements(reminders, notified ?? []);
    if (due.length === 0 && missed.length === 0) return;

    const title = t('routine.notify.title');
    const announce = (list: typeof due, kind: 'due' | 'missed') => {
      if (list.length === 0) return;
      const first = list[0];
      const message =
        list.length === 1 && first
          ? t(`routine.notify.${kind}One`, { task: t(first.template.taskKey) })
          : t(`routine.notify.${kind}Many`, { count: list.length });
      toast.show({ message, tone: 'info' });
      showBrowserNotification(enabled, title, message);
    };
    // Mark first: a re-render triggered by the toast must not announce the same items again.
    markNotified(crewId, [...due, ...missed].map(notifyKey));
    announce(due, 'due');
    announce(missed, 'missed');
  }, [crewId, reminders, notified, enabled, markNotified, toast, t]);

  return null;
}
