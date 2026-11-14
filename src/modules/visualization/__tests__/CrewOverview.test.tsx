import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import type { Measurement } from '@core/types';
import { renderWithProviders } from '@test/renderWithProviders';
import { CrewOverview, filterByRange } from '../index';

describe('<CrewOverview/>', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('renders one link per crew member with a status badge', () => {
    renderWithProviders(<CrewOverview />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute('href', '/crew/crew-1');
    expect(screen.getAllByText('Nominal')).toHaveLength(4);
  });
});

describe('filterByRange', () => {
  const now = new Date('2026-11-14T12:00:00Z');
  const at = (iso: string): Measurement => ({
    id: iso,
    crewId: 'c',
    metric: 'heartRate',
    value: 60,
    timestamp: iso,
    source: 'simulated',
    environment: 'iss',
  });
  const series = [
    at('2026-11-14T06:00:00Z'),
    at('2026-11-10T06:00:00Z'),
    at('2026-10-01T06:00:00Z'),
  ];

  it('filters by window', () => {
    expect(filterByRange(series, '24h', now)).toHaveLength(1);
    expect(filterByRange(series, '7d', now)).toHaveLength(2);
    expect(filterByRange(series, 'all', now)).toHaveLength(3);
  });
});
