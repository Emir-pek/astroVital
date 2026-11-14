import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHealthStore } from '@core/store';
import { renderWithProviders } from '@test/renderWithProviders';
import { RegionDetailPanel } from '../components/RegionDetailPanel';

const headings = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('<RegionDetailPanel/>', () => {
  beforeEach(() => {
    useHealthStore.getState().resetAll();
    useHealthStore.getState().loadDemoData({ seed: 1, days: 30, now: new Date() });
  });

  it('F-06: sections come in the fixed order, action first', () => {
    renderWithProviders(<RegionDetailPanel crewId="crew-1" region="heart" />);
    expect(headings()).toEqual([
      'What should I do?',
      'Current values',
      'Why it matters',
      'What it does',
      'How space affects it',
      'Source and data age',
    ]);
  });

  it('a region without measurements skips the why-it-matters section and says so', () => {
    useHealthStore.getState().resetAll();
    renderWithProviders(<RegionDetailPanel crewId="crew-1" region="heart" />);
    expect(headings()).toEqual([
      'What should I do?',
      'Current values',
      'What it does',
      'How space affects it',
      'Source and data age',
    ]);
    expect(screen.getByText('No direct measurement yet for this region.')).toBeInTheDocument();
  });
});
