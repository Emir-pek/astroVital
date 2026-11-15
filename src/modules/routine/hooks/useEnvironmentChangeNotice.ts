import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { useHealthStore } from '@core/store';
import { useToast } from '@core/ui';

/**
 * Shows one toast whenever the active environment changes (not on first render): the reminder
 * schedule and thresholds now follow the new environment. Mount once (app providers). Reminders
 * need no extra work — they are derived from `activeEnvironment` on every render.
 */
export function useEnvironmentChangeNotice(): void {
  const { t } = useTranslation();
  const toast = useToast();
  const env = useHealthStore((s) => s.activeEnvironment);
  const previous = useRef(env);

  useEffect(() => {
    if (previous.current === env) return;
    previous.current = env;
    toast.show({
      message: t('routine.envChanged', { env: t(ENVIRONMENTS[env].labelKey) }),
      tone: 'info',
    });
  }, [env, t, toast]);
}

/** Renders nothing; runs `useEnvironmentChangeNotice`. */
export function EnvironmentChangeNotice() {
  useEnvironmentChangeNotice();
  return null;
}
