import { useEffect, useRef } from 'react';
import { MS_PER_MINUTE } from '@core/utils/time';
import { useHealthStore } from '@core/store';
import { useTranslation } from 'react-i18next';
import { useToast } from '@core/ui';
import { useReminders } from '../hooks/useReminders';
import {
  notifyKey,
  pendingAnnouncements,
  showBrowserNotification,
} from '../services/notifications';
import { DUE_GRACE_MIN, EARLY_WINDOW_MIN } from '../services/reminderConfig';
import type { ReminderInstance } from '../services/reminderEngine';
import { useRoutineStore } from '../store/useRoutineStore';

/** Moment (ms) an occurrence entered its current status: window opened (due) or grace ended (missed). */
const becameStatusAt = (r: ReminderInstance): number =>
  Date.parse(r.dueAt) + (r.status === 'missed' ? DUE_GRACE_MIN : -EARLY_WINDOW_MIN) * MS_PER_MINUTE;

/**
 * Renders nothing. Announces the SIGNED-IN astronaut's reminders once when they become due and once
 * when missed: an in-app toast always, a browser notification only if the user opted in and the
 * browser granted permission. Mounted once in the app providers. Other astronauts' tasks are never
 * announced; ids already announced are remembered per crew member (persisted).
 *
 * Only what happens DURING the session is announced: an occurrence is news only if it became due
 * (window opened) or missed (grace ended) after the current context started — app start, another
 * astronaut, demo (re)load / reset / import (`demoLoadedAt`), mission start or environment.
 * Anything older is marked as seen silently. Time-based on purpose: it does not depend on render
 * order (e.g. the first render on a fresh device runs before the demo data is loaded and would
 * otherwise report every past task as missed).
 */
export function ReminderNotifier() {
  const { t } = useTranslation();
  const toast = useToast();
  const { crewId, reminders } = useReminders();
  const notified = useRoutineStore((s) => (crewId ? s.notifiedIds[crewId] : undefined));
  const enabled = useRoutineStore((s) => s.notificationsEnabled);
  const markNotified = useRoutineStore((s) => s.markNotified);
  const demoLoadedAt = useHealthStore((s) => s.demoLoadedAt);
  const missionStart = useHealthStore((s) => s.settings.missionStart);
  const environment = useHealthStore((s) => s.activeEnvironment);
  const context = `${crewId ?? ''}|${demoLoadedAt ?? ''}|${missionStart}|${environment}`;
  const baseline = useRef<{ key: string; since: number } | null>(null);

  useEffect(() => {
    if (!crewId) return;
    if (baseline.current?.key !== context) {
      // Event time of the context change (app start, other astronaut, new data …).
      baseline.current = { key: context, since: Date.now() };
    }
    const { since } = baseline.current;
    const until = Date.now();
    const pending = pendingAnnouncements(reminders, notified ?? []);
    // A status that would have started after "now" comes from a stale snapshot (e.g. the minute
    // ticker before its first tick): neither announce nor mark it — it is re-evaluated next render.
    const settled = [...pending.due, ...pending.missed].filter((r) => becameStatusAt(r) <= until);
    if (settled.length === 0) return;
    // News = became due/missed AFTER the context started; older ones are marked silently.
    const isNews = (r: ReminderInstance) => becameStatusAt(r) >= since;
    const due = pending.due.filter((r) => settled.includes(r) && isNews(r));
    const missed = pending.missed.filter((r) => settled.includes(r) && isNews(r));
    const all = settled;
    if (due.length === 0 && missed.length === 0) {
      markNotified(crewId, all.map(notifyKey));
      return;
    }

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
    markNotified(crewId, all.map(notifyKey));
    announce(due, 'due');
    announce(missed, 'missed');
  }, [crewId, context, reminders, notified, enabled, markNotified, toast, t]);

  return null;
}
