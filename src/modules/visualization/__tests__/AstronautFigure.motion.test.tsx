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

describe('<AstronautFigure/> motion rules (spec §5.5, §8, ADR-036)', () => {
  afterEach(() => {
    motionPref.reduce = false;
  });

  it('breathes only the nominal whole-body halo, never an inner region', () => {
    const { container } = render(<AstronautFigure regions={regions()} selected={null} />);
    expect(breathes(container, 'whole_body')).toBe(true);
    for (const id of BODY_REGION_IDS.filter((r) => r !== 'whole_body')) {
      expect(breathes(container, id)).toBe(false);
    }
    expect(container.querySelectorAll('[data-breathing="true"]')).toHaveLength(1);
  });

  it('keeps an alerting halo steady', () => {
    const { container } = render(
      <AstronautFigure regions={regions({ whole_body: 'warning' })} selected={null} />,
    );
    expect(breathes(container, 'whole_body')).toBe(false);
    expect(container.querySelector('[data-breathing="true"]')).toBeNull();
  });

  it('disables breathing entirely when the user prefers reduced motion', () => {
    motionPref.reduce = true;
    const { container } = render(<AstronautFigure regions={regions()} selected={null} />);
    expect(container.querySelector('[data-breathing="true"]')).toBeNull();
    // The halo is still drawn, just without motion.
    expect(group(container, 'whole_body').childElementCount).toBe(1);
  });

  it('leaves nominal inner regions blank and marks advisory, caution and warning', () => {
    const { container } = render(
      <AstronautFigure
        regions={regions({ lungs: 'caution', heart: 'warning', kidneys: 'advisory' })}
        selected={null}
      />,
    );
    expect(group(container, 'brain').childElementCount).toBe(0);
    for (const [id, status] of [
      ['lungs', 'caution'],
      ['heart', 'warning'],
      ['kidneys', 'advisory'],
    ] as const) {
      const g = group(container, id);
      expect(g).toHaveAttribute('data-status', status);
      expect(g.querySelector(`[fill*="-fill-${status})"]`)).not.toBeNull();
    }
  });

  it('draws stale and empty regions without any mark or glow filter', () => {
    const { container } = render(
      <AstronautFigure
        regions={regions({ kidneys: 'stale', blood: 'none', whole_body: 'stale' })}
        selected={null}
      />,
    );
    for (const id of ['kidneys', 'blood', 'whole_body'] as const) {
      const g = group(container, id);
      expect(g.childElementCount).toBe(0);
      expect(g.querySelector('[filter]')).toBeNull();
      expect(breathes(container, id)).toBe(false);
    }
  });

  it('dims the other regions when one is selected, without outlining the selected one', () => {
    const { container } = render(
      <AstronautFigure regions={regions({ lungs: 'caution' })} selected="heart" />,
    );
    expect(group(container, 'heart')).not.toHaveAttribute('opacity');
    expect(group(container, 'lungs')).toHaveAttribute('opacity', '0.3');
    expect(container.querySelector('[stroke="var(--av-accent)"]')).toBeNull();
  });
});
