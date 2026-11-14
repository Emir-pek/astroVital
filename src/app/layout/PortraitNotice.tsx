import { RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Portrait is not supported (landscape tablet only): covers the app with a rotate hint. */
export function PortraitNotice() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-center gap-6 bg-bg p-8 text-center portrait:flex"
    >
      <RotateCw aria-hidden="true" className="size-16 text-text-2" strokeWidth={1.75} />
      <p className="text-headline font-semibold text-text">{t('app.rotateDevice')}</p>
    </div>
  );
}
