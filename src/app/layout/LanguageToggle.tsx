import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@core/i18n';
import { useHealthStore } from '@core/store';

/** One glove-sized button that cycles the UI language (EN / TR) and shows the active one. */
export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useHealthStore((s) => s.settings.language);
  const updateSettings = useHealthStore((s) => s.updateSettings);
  const index = SUPPORTED_LANGUAGES.indexOf(language);
  const next = SUPPORTED_LANGUAGES[(index + 1) % SUPPORTED_LANGUAGES.length] ?? language;
  const code = language.toUpperCase();

  return (
    <button
      type="button"
      aria-label={t('topbar.languageValue', { code })}
      onClick={() => updateSettings({ language: next })}
      className="inline-flex size-touch shrink-0 flex-col items-center justify-center gap-1 rounded-button bg-raised text-label text-text"
    >
      <Globe aria-hidden="true" className="size-6 text-text-2" strokeWidth={1.75} />
      <span className="font-semibold">{code}</span>
    </button>
  );
}
