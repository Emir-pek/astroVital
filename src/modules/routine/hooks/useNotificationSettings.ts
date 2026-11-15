import { useCallback, useState } from 'react';
import {
  notificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../services/notifications';
import { useRoutineStore } from '../store/useRoutineStore';

export interface NotificationSettingsApi {
  /** User switch (persisted). In-app toasts are shown regardless. */
  enabled: boolean;
  /** Browser permission at last check. */
  permission: NotificationPermissionState;
  /**
   * Turning ON asks the browser for permission first (call from the click handler) and only enables
   * when it is granted; turning OFF never prompts. Resolves to the resulting `enabled` value.
   */
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

/** Logic for the Settings "browser notifications" switch (visual: visualization, handoff doc). */
export function useNotificationSettings(): NotificationSettingsApi {
  const enabled = useRoutineStore((s) => s.notificationsEnabled);
  const setStore = useRoutineStore((s) => s.setNotificationsEnabled);
  const [permission, setPermission] = useState<NotificationPermissionState>(notificationPermission);

  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (!next) {
        setStore(false);
        return false;
      }
      const result = await requestNotificationPermission();
      setPermission(result);
      const ok = result === 'granted';
      setStore(ok);
      return ok;
    },
    [setStore],
  );

  return { enabled, permission, setEnabled };
}
