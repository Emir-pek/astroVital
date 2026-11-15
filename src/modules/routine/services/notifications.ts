import type { ReminderInstance } from './reminderEngine';

/** Browser permission state, or 'unsupported' when the Notification API is missing. */
export type NotificationPermissionState = NotificationPermission | 'unsupported';

const api = (): typeof Notification | undefined =>
  typeof window !== 'undefined' && 'Notification' in window ? window.Notification : undefined;

/** Current browser permission (no prompt). */
export const notificationPermission = (): NotificationPermissionState =>
  api()?.permission ?? 'unsupported';

/**
 * Asks the browser for notification permission (must be called from a user gesture, e.g. the
 * Settings switch). Resolves to the resulting permission; never throws.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const N = api();
  if (!N) return 'unsupported';
  if (N.permission !== 'default') return N.permission;
  try {
    return await N.requestPermission();
  } catch {
    return N.permission;
  }
}

/** Shows a browser notification when the user opted in AND the browser granted permission. */
export function showBrowserNotification(enabled: boolean, title: string, body: string): boolean {
  const N = api();
  if (!enabled || !N || N.permission !== 'granted') return false;
  try {
    new N(title, { body, tag: 'astrovital-reminder' });
    return true;
  } catch {
    // Some browsers (e.g. Android Chrome) only allow notifications from a service worker.
    return false;
  }
}

/** Key of one announcement: an occurrence is announced once when due and once when missed. */
export const notifyKey = (r: Pick<ReminderInstance, 'id' | 'status'>): string =>
  `${r.id}#${r.status}`;

/**
 * Occurrences that should be announced now: due or missed, not yet announced. PURE.
 * Grouped so a burst (six morning tasks at 06:30) becomes one message per status.
 */
export const pendingAnnouncements = (
  reminders: readonly ReminderInstance[],
  notified: readonly string[],
): { due: ReminderInstance[]; missed: ReminderInstance[] } => {
  const seen = new Set(notified);
  const fresh = reminders.filter(
    (r) => (r.status === 'due' || r.status === 'missed') && !seen.has(notifyKey(r)),
  );
  return {
    due: fresh.filter((r) => r.status === 'due'),
    missed: fresh.filter((r) => r.status === 'missed'),
  };
};
