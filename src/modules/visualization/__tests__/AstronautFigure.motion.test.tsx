import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import type { DisplayStatus } from '@core/ui';
import type * as FramerMotion from 'framer-motion';
import { AstronautFigure } from '../components/figure/AstronautFigure';

/** Controls framer-motion's reduced-motion hook per test. */
const motionPref = vi.hoisted(() => ({ reduce: false }));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof FramerMotion>();
  return { ...actual, useReducedMotion: () => motionPref.reduce };
});

const regions = (overrides: Partial<Record<BodyRegionId, DisplayStatus>> = {}) => ({
  ...(Object.fromEntries(BODY_REGION_IDS.map((id) => [id, 'nominal'])) as Record<
    BodyRegionId,
    DisplayStatus
  >),
  ...overrides,
});

const group = (container: HTMLElement, id: BodyRegionId) => {
  const g = container.querySelector(`svg g[data-region="${id}"]`);
  if (!g) throw new Error(`missing region group ${id}`);
  return g;
};

const breathes = (container: HTMLElement, id: BodyRegionId) =>
  group(container, id).closest('[data-breathing="true"]') !== null;

describe('<AstronautFigure/> motion rules (spec §5.5, §8)', () => {
  afterEach(() => {
    motionPref.reduce = false;
  });

  it('breathes nominal regions, including the whole-body halo', () => {
    const { container } = render(<AstronautFigure regions={regions()} selected={null} />);
    for (const id of BODY_REGION_IDS) expect(breathes(container, id)).toBe(true);
  });

  it('keeps caution, warning and advisory regions steady', () => {
    const { container } = render(
      <AstronautFigure
        regions={regions({
          lungs: 'caution',
          heart: 'warning',
          kidneys: 'advisory',
          whole_body: 'warning',
        })}
        selected={null}
      />,
    );
    expect(breathes(container, 'lungs')).toBe(false);
    expect(breathes(container, 'heart')).toBe(false);
    expect(breathes(container, 'kidneys')).toBe(false);
    expect(breathes(container, 'whole_body')).toBe(false);
    // Nominal neighbours still breathe.
    expect(breathes(container, 'brain')).toBe(true);
  });

  it('disables breathing entirely when the user prefers reduced motion', () => {
    motionPref.reduce = true;
    const { container } = render(<AstronautFigure regions={regions()} selected={null} />);
    expect(container.querySelector('[data-breathing="true"]')).toBeNull();
    // Regions are still drawn, just without motion.
    expect(group(container, 'heart')).toHaveAttribute('data-status', 'nominal');
  });

  it('draws stale regions without any glow filter', () => {
    const { container } = render(
      <AstronautFigure
        regions={regions({ kidneys: 'stale', blood: 'stale', whole_body: 'stale' })}
        selected={null}
      />,
    );
    for (const id of ['kidneys', 'blood', 'whole_body'] as const) {
      const g = group(container, id);
      expect(g).toHaveAttribute('data-status', 'stale');
      expect(g.hasAttribute('filter')).toBe(false);
      expect(g.querySelector('[filter]')).toBeNull();
      expect(breathes(container, id)).toBe(false);
    }
  });

  it('outlines the selected region in the accent colour', () => {
    const { container } = render(<AstronautFigure regions={regions()} selected="heart" />);
    expect(group(container, 'heart').querySelector('[stroke="var(--av-accent)"]')).not.toBeNull();
    expect(group(container, 'lungs').querySelector('[stroke="var(--av-accent)"]')).toBeNull();
  });
});
