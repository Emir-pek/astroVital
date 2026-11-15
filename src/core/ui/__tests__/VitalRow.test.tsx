import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { ArcGauge } from '../ArcGauge';
import { StatusLine } from '../StatusLine';
import { VitalRow } from '../VitalRow';

const base = {
  label: 'Heart rate',
  value: '72',
  unit: 'bpm',
  statusLabel: 'Nominal',
  measuredText: 'Last measured 2 min ago',
};

const HR_BANDS = [
  { from: 0, to: 40, status: 'caution' as const },
  { from: 100, to: 130, status: 'caution' as const },
  { from: 130, to: 400, status: 'warning' as const },
];

describe('VitalRow', () => {
  it('shows label, monospace value, unit and the status as colour + icon + text', () => {
    renderWithProviders(<VitalRow {...base} status="nominal" />);
    expect(screen.getByText('72')).toHaveClass('font-mono');
    expect(screen.getByText('bpm')).toBeVisible();
    const badge = screen.getByText('Nominal').closest('[data-status]');
    expect(badge).toHaveAttribute('data-status', 'nominal');
    expect(badge?.querySelector('svg')).not.toBeNull();
  });

  it('keeps the data age for screen readers when fresh, shows it with the hint when stale', () => {
    const { unmount } = renderWithProviders(<VitalRow {...base} status="nominal" />);
    expect(screen.getByText('Last measured 2 min ago')).toHaveClass('sr-only');
    unmount();
    renderWithProviders(
      <VitalRow
        {...base}
        status="stale"
        statusLabel="Stale data"
        measuredText="Last measured 14 h ago · measure again"
      />,
    );
    const hint = screen.getByText(/measure again/);
    expect(hint).not.toHaveClass('sr-only');
    expect(hint.closest('.opacity-50')).toBeNull();
    expect(screen.getByText('72').closest('.opacity-50')).not.toBeNull();
  });

  it('shows the out-of-range arrow only for caution/warning', () => {
    const { unmount } = renderWithProviders(
      <VitalRow {...base} status="warning" direction="down" directionLabel="below normal" />,
    );
    expect(screen.getByLabelText('below normal')).toHaveTextContent('▼');
    unmount();
    renderWithProviders(
      <VitalRow {...base} status="nominal" direction="down" directionLabel="below normal" />,
    );
    expect(screen.queryByLabelText('below normal')).toBeNull();
  });

  it('colours the gauge segment of the value with the row status', () => {
    renderWithProviders(
      <VitalRow
        {...base}
        status="caution"
        value="112"
        gauge={{ value: 112, min: 30, max: 220, bands: HR_BANDS, label: 'Heart rate gauge' }}
      />,
    );
    const active = screen
      .getByRole('img', { name: 'Heart rate gauge' })
      .querySelector('[data-active]');
    expect(active).toHaveAttribute('stroke', 'var(--av-status-caution)');
  });
});

describe('ArcGauge (mini)', () => {
  it('colours only the segment the value sits in; the rest of the track is neutral', () => {
    renderWithProviders(
      <ArcGauge value={72} min={30} max={220} bands={HR_BANDS} label="HR" status="nominal" />,
    );
    const svg = screen.getByRole('img', { name: 'HR' });
    const segments = [...svg.querySelectorAll('[data-segment]')];
    expect(segments.map((s) => s.getAttribute('data-segment'))).toEqual([
      'caution',
      'nominal',
      'caution',
      'warning',
    ]);
    const coloured = segments.filter((s) => s.getAttribute('stroke') !== 'var(--av-text-3)');
    expect(coloured).toHaveLength(1);
    expect(coloured[0]).toHaveAttribute('data-segment', 'nominal');
    expect(coloured[0]).toHaveAttribute('stroke', 'var(--av-status-nominal)');
  });

  it('without a status the active segment takes its own threshold status', () => {
    renderWithProviders(<ArcGauge value={150} min={30} max={220} bands={HR_BANDS} label="HR" />);
    const active = screen.getByRole('img', { name: 'HR' }).querySelector('[data-active]');
    expect(active).toHaveAttribute('stroke', 'var(--av-status-warning)');
  });
});

describe('StatusLine', () => {
  it('is a labelled live region with icon and sentence', () => {
    renderWithProviders(<StatusLine status="nominal" text="All clear" label="Alerts" />);
    const region = screen.getByRole('region', { name: 'Alerts' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('All clear');
    expect(region.querySelector('svg')).not.toBeNull();
  });
});
