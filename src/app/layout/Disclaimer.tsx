import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Always-visible "Prototype, not a medical device" note (required on every page). */
export function Disclaimer() {
  const { t } = useTranslation();
  return (
    <p role="note" className="flex items-center gap-2 px-6 py-3 text-label text-text-3">
      <ShieldAlert aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
      {t('app.disclaimer')}
    </p>
  );
}
