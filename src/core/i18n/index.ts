import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import tr from './tr.json';

export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
} as const;

/**
 * Initialised synchronously at import time (resources are bundled — offline-first).
 * The active language is synced from the store by the app's I18nSync provider.
 * RULE: every UI string goes through t('key'); add the key to BOTH en.json and tr.json
 * (a unit test fails if they diverge).
 */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false }, // React already escapes
    returnNull: false,
    initAsync: false,
  });
}

export { i18n };
export default i18n;
