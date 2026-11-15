import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@core/i18n';
import { ToastProvider } from '@core/ui';
import { DemoDataBootstrap } from './DemoDataBootstrap';
import { I18nSync } from './I18nSync';
import { LedSync } from './LedSync';
import { ThemeSync } from './ThemeSync';

/** All global providers + store→DOM synchronisers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <I18nSync />
        <ThemeSync />
        <LedSync />
        <DemoDataBootstrap />
        {children}
      </ToastProvider>
    </I18nextProvider>
  );
}
