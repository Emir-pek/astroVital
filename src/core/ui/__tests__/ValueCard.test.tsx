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

describe('U-05 / U-07 extras', () => {
  it('U-05: warning + down shows the down arrow with its label', () => {
    renderWithProviders(
      <ValueCard {...base} status="warning" direction="down" directionLabel="below normal" />,
    );
    expect(screen.getByLabelText('below normal')).toHaveTextContent('▼');
  });

  it('U-05: stale dims the value but keeps the re-measure text at full contrast', () => {
    renderWithProviders(
      <ValueCard {...base} status="stale" measuredText="Last measured 14 h ago · measure again" />,
    );
    expect(screen.getByText('72').closest('.opacity-50')).not.toBeNull();
    expect(screen.getByText(/measure again/).closest('.opacity-50')).toBeNull();
  });

  it('U-07 (B4): an off-scale value is marked and announced', () => {
    const gauge = { value: 250, min: 30, max: 220, bands: [], label: 'Heart rate gauge' };
    renderWithProviders(
      <ValueCard {...base} status="warning" gauge={{ ...gauge, offScaleLabel: 'off scale' }} />,
    );
    const high = screen.getByRole('img', { name: 'Heart rate gauge · off scale' });
    expect(high).toHaveAttribute('data-off-scale', 'high');
    expect(high).toHaveTextContent('▶');
  });

  it('U-07: an in-range value has no off-scale marker', () => {
    const gauge = { value: 80, min: 30, max: 220, bands: [], label: 'Heart rate gauge' };
    renderWithProviders(
      <ValueCard {...base} status="nominal" gauge={{ ...gauge, offScaleLabel: 'off scale' }} />,
    );
    const img = screen.getByRole('img', { name: 'Heart rate gauge' });
    expect(img).not.toHaveAttribute('data-off-scale');
  });
});
