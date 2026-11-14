import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { VitalsPanel } from '../components/VitalsPanel';

describe('<VitalsPanel/>', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('shows the six primary cards with monospace values from the demo data', () => {
    useHealthStore.getState().loadDemoData({ seed: 1, days: 30, now: new Date() });
    renderWithProviders(<VitalsPanel crewId="crew-1" />);
    const list = screen.getByRole('list', { name: 'Latest values' });
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThanOrEqual(6);
    const heart = screen.getByText('Resting heart rate').closest('[data-status]');
    expect(heart?.querySelector('.font-mono')?.textContent).toMatch(/[0-9]/);
    expect(screen.getByText('Blood pressure')).toBeInTheDocument();
  });

  it('without measurements no card looks nominal', () => {
    renderWithProviders(<VitalsPanel crewId="crew-1" />);
    const list = screen.getByRole('list', { name: 'Latest values' });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.querySelector('[data-status]')).toHaveAttribute('data-status', 'none');
    }
    expect(screen.queryByText('Nominal')).not.toBeInTheDocument();
  });
});
