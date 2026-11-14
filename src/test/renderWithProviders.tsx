import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { i18n } from '@core/i18n';
import { ToastProvider } from '@core/ui';

/**
 * Renders with i18n (EN) + Toast + MemoryRouter. Shared by every module's component tests:
 *   import { renderWithProviders } from '@test/renderWithProviders';
 * Only import `@test/*` from `__tests__` folders (test-only infrastructure).
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderOptions & { route?: string } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ToastProvider>
    </I18nextProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
