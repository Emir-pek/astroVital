import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import { renderWithProviders } from '@test/renderWithProviders';
import { BodyMapView, type RegionView } from '../components/BodyMap';

// This device "has" WebGL, and the lazy 3D chunk never finishes loading (a slow first load).
vi.mock('../components/figure3d/webgl', () => ({ canUseWebGL: () => true }));
vi.mock('../components/figure3d/AstronautStage', () => ({
  default: () => {
    throw new Promise<never>(() => {});
  },
}));

const regions: RegionView[] = BODY_REGION_IDS.map((id) => ({
  id,
  status: 'nominal',
  label: id,
  statusLabel: 'Nominal',
}));

describe('<BodyMapView/> while the 3D chunk loads', () => {
  it('draws neither the old SVG astronaut nor its leaders, but keeps the labels usable', () => {
    const { container } = renderWithProviders(
      <BodyMapView
        regions={regions}
        selectedRegion={null}
        onRegionSelect={vi.fn()}
        ariaLabelFor={(r) => r.label}
      />,
    );
    // The SVG figure marks its regions with <g data-region>; the labels are <button data-region>.
    expect(container.querySelectorAll('g[data-region]')).toHaveLength(0);
    expect(container.querySelector('[data-breathing]')).toBeNull();
    expect(container.querySelectorAll('[data-leader]')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });
});
