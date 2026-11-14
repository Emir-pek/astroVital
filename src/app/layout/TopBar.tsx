import { Globe, Orbit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SUPPORTED_LANGUAGES } from '@core/i18n';
import { useActiveEnvironment, useHealthStore, type Language } from '@core/store';
import { MetClock } from '@modules/routine';

/** MET clock · environment badge (gravity, comm delay) · language switcher. */
export function TopBar() {
  const { t } = useTranslation();
  const env = useActiveEnvironment();
  const language = useHealthStore((s) => s.settings.language);
  const updateSettings = useHealthStore((s) => s.updateSettings);
  const [minDelay, maxDelay] = env.oneWayCommDelaySec;

  const formatDelay = (sec: number): string =>
    sec < 60
      ? t('common.seconds', { count: Math.round(sec * 10) / 10 })
      : t('common.minutes', { count: Math.round(sec / 60) });

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-2 backdrop-blur">
      <MetClock />

      <Link
        to="/settings"
        className="inline-flex items-center gap-2 rounded-full border border-env/40 bg-env/10 px-3 py-1 text-sm"
        title={`${t('topbar.gravity', { g: env.gravityG })} · ${t('topbar.commDelay', {
          min: formatDelay(minDelay),
          max: formatDelay(maxDelay),
        })}`}
      >
        <Orbit aria-hidden="true" className="size-4 text-env" />
        <span className="sr-only">{t('topbar.environment')}:</span>
        {t(env.labelKey)}
        <span className="hidden text-xs text-muted lg:inline">
          · {t('topbar.gravity', { g: env.gravityG })}
        </span>
      </Link>

      <label className="inline-flex items-center gap-2 text-sm">
        <Globe aria-hidden="true" className="size-4 text-muted" />
        <span className="sr-only">{t('topbar.language')}</span>
        <select
          value={language}
          onChange={(e) => updateSettings({ language: e.target.value as Language })}
          className="rounded-md border border-border bg-surface-2 px-2 py-1"
        >
          {SUPPORTED_LANGUAGES.map((lng) => (
            <option key={lng} value={lng}>
              {lng.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
