import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@core/store';
import { computeMET, formatMET } from '@core/utils/time';

/** Live Mission Elapsed Time "DDD/HH:MM:SS" since settings.missionStart. */
export function MetClock() {
  const { t } = useTranslation();
  const { missionStart } = useSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm" title={t('topbar.met')}>
      <Clock aria-hidden="true" className="size-4 text-env" />
      <span className="text-muted">{t('topbar.metShort')}</span>
      <time aria-label={t('topbar.met')}>{formatMET(computeMET(missionStart, now))}</time>
    </span>
  );
}
