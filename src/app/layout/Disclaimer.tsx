import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Always-visible "Prototype — not a medical device." banner (required on every page). */
export function Disclaimer() {
  const { t } = useTranslation();
  return (
    <p
      role="note"
      className="flex items-center gap-2 border-b border-warn/30 bg-warn/10 px-4 py-1.5 text-xs text-warn"
    >
      <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
      {t('app.disclaimer')}
    </p>
  );
}
