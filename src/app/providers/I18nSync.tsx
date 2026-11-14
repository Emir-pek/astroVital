import { useEffect } from 'react';
import { i18n } from '@core/i18n';
import { useHealthStore } from '@core/store';

/** Keeps i18next + <html lang> in sync with the persisted language setting. */
export function I18nSync() {
  const language = useHealthStore((s) => s.settings.language);
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
