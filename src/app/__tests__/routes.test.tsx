import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { AppProviders } from '../providers/AppProviders';
import { routes } from '../router';

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
    ['/', 'Status'],
    ['/measure', 'Measure'],
    ['/history', 'History'],
    ['/team', 'Team'],
    ['/routine', 'Routine'],
    ['/emergency', 'Emergency procedure'],
    ['/settings', 'Settings'],
    ['/does-not-exist', 'Page not found'],
  ])('%s renders "%s" with the disclaimer', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('not a medical device');
  });

  it('sidebar has exactly 5 glove-sized items', async () => {
    renderAt('/');
    const nav = await screen.findByRole('navigation', { name: 'Main navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(5);
    links.forEach((l) => expect(l).toHaveClass('min-h-touch'));
  });

  it('emergency button opens the procedure', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: 'Emergency' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Emergency procedure' }),
    ).toBeInTheDocument();
  });

  it('crew picker switches the signed-in astronaut', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: /Mira Okafor/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Kenji Arata' }));
    expect(useHealthStore.getState().selectedCrewId).toBe('crew-2');
  });

  it('portrait notice exists with rotate text', async () => {
    renderAt('/');
    expect(await screen.findByText('Turn the tablet to landscape')).toBeInTheDocument();
  });

  it('switches UI language to Turkish from the store', async () => {
    useHealthStore.getState().updateSettings({ language: 'tr' });
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Durum' })).toBeInTheDocument();
  });
});
