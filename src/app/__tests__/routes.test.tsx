import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { AppProviders } from '../providers/AppProviders';
import { routes } from '../router';

/** Phase-0 exit criterion: every page opens with stub components and demo data. */
const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
};

describe('app routes', () => {
  beforeEach(() => {
    useHealthStore.getState().resetAll();
    useHealthStore.getState().loadDemoData({ seed: 1, days: 30, now: new Date() });
  });

  it.each([
    ['/', 'Mission dashboard'],
    ['/crew/crew-1', 'Mira Okafor — Commander'],
    ['/log', 'Log a measurement'],
    ['/alerts', 'Alerts'],
    ['/learn', 'Learn'],
    ['/mission', 'Health missions'],
    ['/settings', 'Settings'],
    ['/does-not-exist', 'Page not found'],
  ])('%s renders "%s" with the disclaimer', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('not a medical device');
  });

  it('/crew redirects to the selected crew member', async () => {
    renderAt('/crew');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Mira Okafor/ }),
    ).toBeInTheDocument();
  });

  it('switches UI language to Turkish from the store', async () => {
    useHealthStore.getState().updateSettings({ language: 'tr' });
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Görev paneli' }),
    ).toBeInTheDocument();
  });
});
