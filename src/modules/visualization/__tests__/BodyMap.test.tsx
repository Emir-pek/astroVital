import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import { useHealthStore } from '@core/store';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import { renderWithProviders } from '@test/renderWithProviders';
import { BodyMap } from '../index';
import { BodyMapView, type RegionView } from '../components/BodyMap';
import { RegionChips } from '../components/RegionChips';

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

describe('<BodyMapView/>', () => {
  it('renders one glove-sized invisible button per region with data attributes', () => {
    renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion={null}
        onRegionSelect={() => {}}
        ariaLabelFor={ariaLabelFor}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
    for (const b of buttons) {
      expect(b).toHaveClass('size-touch');
      expect(b).toHaveAttribute('data-region');
      expect(b).toHaveAttribute('data-status');
    }
    expect(screen.getByRole('button', { name: 'Lungs: Caution' })).toHaveAttribute(
      'data-status',
      'caution',
    );
  });

  it('labels a region with its name and status', () => {
    renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion={null}
        onRegionSelect={() => {}}
        ariaLabelFor={ariaLabelFor}
      />,
    );
    expect(screen.getByRole('button', { name: 'Heart: Nominal' })).toHaveAttribute(
      'data-region',
      'heart',
    );
  });

  it('selects a region on tap and marks the selected one pressed', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion="lungs"
        onRegionSelect={onSelect}
        ariaLabelFor={ariaLabelFor}
      />,
    );
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

  it('draws a dashed contour for a region without data', () => {
    const { container } = renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion={null}
        onRegionSelect={() => {}}
        ariaLabelFor={ariaLabelFor}
      />,
    );
    const group = container.querySelector('svg g[data-region="eyes"]');
    expect(group).not.toBeNull();
    expect(group).toHaveAttribute('data-status', 'none');
    expect(group?.querySelector('[stroke-dasharray="6 6"]')).not.toBeNull();
    // Regions with data get no dashed contour.
    const heart = container.querySelector('svg g[data-region="heart"]');
    expect(heart).toHaveAttribute('data-status', 'nominal');
    expect(heart?.querySelector('[stroke-dasharray]')).toBeNull();
  });

  it('gives every region a figure group carrying its status', () => {
    const { container } = renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion={null}
        onRegionSelect={() => {}}
        ariaLabelFor={ariaLabelFor}
      />,
    );
    for (const r of regions) {
      const g = container.querySelector(`svg g[data-region="${r.id}"]`);
      expect(g).toHaveAttribute('data-status', r.status);
    }
  });
});

describe('<RegionChips/>', () => {
  it('renders 10 chips with name and calls onRegionSelect on tap', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <RegionChips regions={regions} selectedRegion="bones" onRegionSelect={onSelect} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
    for (const b of buttons) {
      expect(b).toHaveClass('min-h-touch', 'min-w-touch');
    }
    const kidneys = screen.getByRole('button', { name: /Kidneys/ });
    expect(within(kidneys).getByText('Kidneys')).toBeInTheDocument();
    // Colour is never the only cue: the status is part of the accessible name.
    expect(kidneys).toHaveAccessibleName(/Stale/);
    fireEvent.click(kidneys);
    expect(onSelect).toHaveBeenCalledWith('kidneys');
    expect(screen.getByRole('button', { name: /Bones/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('<BodyMap/> container', () => {
  beforeEach(() => useHealthStore.getState().resetAll());

  it('renders the figure overlay and chips with translated labels', () => {
    renderWithProviders(
      <BodyMap crewId="crew-1" selectedRegion={null} onRegionSelect={() => {}} />,
    );
    // 10 hit areas + 10 chips
    expect(screen.getAllByRole('button')).toHaveLength(20);
    // Eyes have no numeric metric yet → "No data".
    expect(screen.getAllByRole('button', { name: /Eyes.*No data/ }).length).toBeGreaterThan(0);
  });
});
