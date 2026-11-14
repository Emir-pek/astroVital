import { FlaskConical, OctagonAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@core/ui';
import { MetClock } from '@modules/routine';
import { CrewPicker } from './CrewPicker';
import { EnvironmentPicker } from './EnvironmentPicker';
import { LanguageToggle } from './LanguageToggle';

/** MET clock, environment, "simulated data" tag, Emergency, language, signed-in astronaut. */
export function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-touch-gap bg-bg/80 px-6 py-3 backdrop-blur">
      <MetClock />
      <EnvironmentPicker />
      <p className="flex items-center gap-2 text-label text-text-2">
        <FlaskConical aria-hidden="true" className="size-6 shrink-0" strokeWidth={1.75} />
        {t('topbar.simulated')}
      </p>
      <Button
        variant="secondary"
        icon={<OctagonAlert aria-hidden="true" className="size-7 text-warning" />}
        onClick={() => void navigate('/emergency')}
      >
        {t('topbar.emergency')}
      </Button>
      <LanguageToggle />
      <CrewPicker />
    </header>
  );
}
