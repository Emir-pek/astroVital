import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * "Prototype, not a medical device" note (required on every page): the app's bottom row, under
 * the navigation and the page, always on screen.
 */
export function Disclaimer() {
  const { t } = useTranslation();
  return (
    <p
      role="note"
      className="col-span-full flex items-center gap-2 border-t border-line bg-bg px-6 py-2 text-label text-text-3"
    >
      <ShieldAlert aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
      {t('app.disclaimer')}
    </p>
  );
}
