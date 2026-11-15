import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import { useHealthStore } from '@core/store';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { renderWithProviders } from '@test/renderWithProviders';
import { BodyMap } from '../index';
import { BodyMapView, type RegionView } from '../components/BodyMap';
import { COLUMNS } from '../components/figure/layout';

const LABELS: Record<BodyRegionId, string> = {
  brain: 'Brain',
  eyes: 'Eyes',
  heart: 'Heart',
  lungs: 'Lungs',
  blood: 'Blood',
  bones: 'Bones',
  muscles: 'Muscles',
  immune: 'Immune system',
  kidneys: 'Kidneys',
  whole_body: 'Whole body',
};

const STATUS_OF: Partial<Record<BodyRegionId, DisplayStatus>> = {
  eyes: 'none',
  lungs: 'caution',
  kidneys: 'stale',
  bones: 'warning',
};

const regions: RegionView[] = BODY_REGION_IDS.map((id) => {
  const status = STATUS_OF[id] ?? 'nominal';
  return { id, status, label: LABELS[id], statusLabel: status[0].toUpperCase() + status.slice(1) };
});

const ariaLabelFor = (r: RegionView) => `${r.label}: ${r.statusLabel}`;

const renderView = (selectedRegion: BodyRegionId | null = null, onRegionSelect = vi.fn()) =>
  renderWithProviders(
    <BodyMapView
      regions={regions}
      selectedRegion={selectedRegion}
      onRegionSelect={onRegionSelect}
      ariaLabelFor={ariaLabelFor}
    />,
  );

describe('<BodyMapView/> region labels', () => {
  it('renders one visible, glove-sized label per region with data attributes', () => {
    renderView();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
    for (const b of buttons) {
      expect(b).toHaveClass('min-h-touch', 'min-w-touch');
      expect(b).toHaveAttribute('data-region');
      expect(b).toHaveAttribute('data-status');
    }
    expect(screen.getByRole('button', { name: 'Lungs: Caution' })).toHaveAttribute(
      'data-status',
      'caution',
    );
  });

  it('shows the region name and its status as colour + icon + text', () => {
    renderView();
    const kidneys = screen.getByRole('button', { name: 'Kidneys: Stale' });
    expect(within(kidneys).getByText('Kidneys')).toBeVisible();
    const badge = within(kidneys).getByText('Stale').closest('[data-status]');
    expect(badge).toHaveAttribute('data-status', 'stale');
    expect(badge?.querySelector('svg')).not.toBeNull();
  });

  it('marks alert labels with a status-coloured edge, calm labels without', () => {
    renderView();
    expect(screen.getByRole('button', { name: 'Bones: Warning' })).toHaveClass('border-warning');
    expect(screen.getByRole('button', { name: 'Lungs: Caution' })).toHaveClass('border-caution');
    expect(screen.getByRole('button', { name: 'Heart: Nominal' })).toHaveClass(
      'border-transparent',
    );
  });

  it('places labels down the left column, then the right one (keyboard order)', () => {
    renderView();
    const order = screen.getAllByRole('button').map((b) => b.getAttribute('data-region'));
    expect(order).toEqual([...COLUMNS.left, ...COLUMNS.right]);
  });

  it('selects a region on tap and marks the selected one pressed', () => {
    const onSelect = vi.fn();
    renderView('lungs', onSelect);
    fireEvent.click(screen.getByRole('button', { name: 'Heart: Nominal' }));
    expect(onSelect).toHaveBeenCalledWith('heart');
    expect(screen.getByRole('button', { name: 'Lungs: Caution' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Heart: Nominal' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('<BodyMapView/> figure and leader lines', () => {
  it('gives every region a figure group carrying its status', () => {
    const { container } = renderView();
    for (const r of regions) {
      const g = container.querySelector(`svg g[data-region="${r.id}"]`);
      expect(g).toHaveAttribute('data-status', r.status);
    }
  });

  it('draws nothing on the figure for nominal, stale and empty regions', () => {
    const { container } = renderView();
    for (const id of ['heart', 'kidneys', 'eyes'] as const) {
      expect(container.querySelector(`svg g[data-region="${id}"]`)?.childElementCount).toBe(0);
    }
  });

  it('draws a clipped status mark with a dark keyline for alert regions', () => {
    const { container } = renderView();
    const lungs = container.querySelector('svg g[data-region="lungs"]');
    const clipped = lungs?.querySelector('[clip-path]');
    expect(clipped).not.toBeNull();
    expect(clipped?.querySelector('[fill*="-fill-caution)"]')).not.toBeNull();
    expect(clipped?.querySelector('[stroke="var(--av-bg)"]')).not.toBeNull();
  });

  it('draws one leader per region; alert leaders end in a status glyph', () => {
    const { container } = renderView();
    expect(container.querySelectorAll('[data-leader]')).toHaveLength(10);
    const glyphs = [...container.querySelectorAll('[data-glyph]')].map((g) =>
      g.getAttribute('data-glyph'),
    );
    expect(glyphs.sort()).toEqual(['caution', 'warning']);
  });

  it('turns the selected leader to the accent colour and dims the others', () => {
    const { container } = renderView('heart');
    const heart = container.querySelector('[data-leader="heart"]');
    expect(heart?.querySelector('[stroke="var(--av-accent)"]')).not.toBeNull();
    expect(heart).not.toHaveAttribute('opacity');
    const lungs = container.querySelector('[data-leader="lungs"]');
    expect(lungs?.querySelector('[stroke="var(--av-accent)"]')).toBeNull();
    expect(lungs).toHaveAttribute('opacity', '0.35');
    // No outline circle on the figure: the selected region's group only dims the others.
    expect(container.querySelector('svg g[data-region="heart"]')).not.toHaveAttribute('opacity');
    expect(container.querySelector('svg g[data-region="lungs"]')).toHaveAttribute('opacity');
  });
});

describe('<BodyMap/> container', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('renders ten region labels with translated names', () => {
    renderWithProviders(
      <BodyMap crewId="crew-1" selectedRegion={null} onRegionSelect={() => {}} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(10);
    // Eyes have no numeric metric yet → "No data".
    expect(screen.getByRole('button', { name: /Eyes.*No data/ })).toBeInTheDocument();
  });
});
