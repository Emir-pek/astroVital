import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNow } from '@core/hooks';
import { useActiveEnvironment, useSettings } from '@core/store';
import { computeMET, formatMET, formatTimeInDay, missionDayFor } from '@core/utils/time';

/**
 * Live mission clock: "Day 12 · 04:33:10", or "Sol 12 · 04:33:10" on a Mars base (ADR-030).
 * The full MET (DDD/HH:MM:SS, Earth days) stays available as the tooltip.
 */
export function MetClock() {
  const { t } = useTranslation();
  const { missionStart } = useSettings();
  const env = useActiveEnvironment();
  const now = useNow();

  const dayLengthSec = env.dayLengthSec ?? 86_400;
  const day = missionDayFor(missionStart, now, dayLengthSec);
  const label = t(env.dayLabelKey ?? 'time.missionDay', { n: day });
  const met = formatMET(computeMET(missionStart, now));

  return (
    <span className="inline-flex items-center gap-2 font-mono text-body" title={t('topbar.met')}>
      <Clock aria-hidden="true" className="size-4 text-text-2" />
      <span className="text-muted">{t('topbar.metShort')}</span>
      <time aria-label={t('topbar.met')}>
        {label} · {formatTimeInDay(missionStart, now, dayLengthSec)}
      </time>
    </span>
  );
}
