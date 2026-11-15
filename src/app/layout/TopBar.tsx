import { FlaskConical, OctagonAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@core/ui';
import { MetClock } from '@modules/routine';
import { CrewPicker } from './CrewPicker';
import { EnvironmentPicker } from './EnvironmentPicker';
import { LanguageToggle } from './LanguageToggle';

/**
 * MET clock + "simulated data" tag, environment, Emergency, language, signed-in astronaut.
 * One row, never wrapping (1180 px, EN and TR): 104 px controls + 12 px padding = 128 px tall.
 * The right-hand controls have fixed widths, so switching language (or environment, or astronaut)
 * never moves them (design 2026-11-15 §3.4). Frosted-glass bar (`av-glass-bar`, index.css).
 */
export function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <header className="av-glass-bar flex shrink-0 flex-nowrap items-center justify-between gap-touch-gap px-6 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <MetClock />
        <p className="flex items-center gap-2 text-label whitespace-nowrap text-text-2">
          <FlaskConical aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
          {t('topbar.simulated')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-touch-gap">
        <EnvironmentPicker />
        <Button
          variant="secondary"
          // Fits "Emergency" (EN, the longest); TR "Acil" gets the same box.
          className="w-44 shrink-0"
          icon={<OctagonAlert aria-hidden="true" className="size-7 text-warning" />}
          onClick={() => void navigate('/emergency')}
        >
          {t('topbar.emergency')}
        </Button>
        <LanguageToggle />
        <CrewPicker />
      </div>
    </header>
  );
}
