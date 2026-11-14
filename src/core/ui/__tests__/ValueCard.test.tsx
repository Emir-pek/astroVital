import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { ValueCard } from '../ValueCard';

const base = {
  label: 'Heart rate',
  value: '72',
  unit: 'bpm',
  statusLabel: 'Status',
  measuredText: 'Measured 2 min ago',
};

describe('ValueCard', () => {
  it('shows the arrow only for caution/warning', () => {
    const { unmount } = renderWithProviders(
      <ValueCard {...base} status="caution" direction="up" directionLabel="High" />,
    );
    expect(screen.getByText('▲')).toHaveAttribute('aria-label', 'High');
    unmount();
    renderWithProviders(
      <ValueCard {...base} status="nominal" direction="up" directionLabel="High" />,
    );
    expect(screen.queryByText('▲')).toBeNull();
  });

  it('stale card is never nominal and tells to re-measure', () => {
    renderWithProviders(
      <ValueCard
        label="Heart rate"
        value="72"
        unit="bpm"
        status="stale"
        statusLabel="Stale"
        measuredText="Last measured 14 h ago · measure again"
      />,
    );
    const card = screen.getByText('Heart rate').closest('[data-status]');
    expect(card).toHaveAttribute('data-status', 'stale');
    expect(screen.getByText(/measure again/)).toBeVisible();
    expect(screen.getByText('72').closest('.opacity-50')).not.toBeNull();
  });

  it('renders gauge with accessible label', () => {
    renderWithProviders(
      <ValueCard
        {...base}
        status="nominal"
        gauge={{ value: 72, min: 40, max: 180, bands: [], label: 'Heart rate gauge' }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Heart rate gauge' })).toBeInTheDocument();
  });
});
