import { describe, expect, it } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import type { BodyRegionId } from '@core/types';
import { HIT_AREAS, HIT_SIZE, STAGE } from '../components/figure/hitAreas';

type Box = { left: number; top: number };

/** Largest free distance between two HIT_SIZE boxes along either axis (negative = overlap). */
function gapBetween(a: Box, b: Box): number {
  const horizontal = Math.max(b.left - (a.left + HIT_SIZE), a.left - (b.left + HIT_SIZE));
  const vertical = Math.max(b.top - (a.top + HIT_SIZE), a.top - (b.top + HIT_SIZE));
  return Math.max(horizontal, vertical);
}

describe('figure hit areas', () => {
  it('are glove-sized (104 px)', () => {
    expect(HIT_SIZE).toBe(104);
  });

  it('cover every body region', () => {
    expect(Object.keys(HIT_AREAS).sort()).toEqual([...BODY_REGION_IDS].sort());
  });

  it.each(BODY_REGION_IDS)('%s box lies inside the stage', (id) => {
    const { left, top } = HIT_AREAS[id];
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + HIT_SIZE).toBeLessThanOrEqual(STAGE.width);
    expect(top + HIT_SIZE).toBeLessThanOrEqual(STAGE.height);
  });

  it('keeps >= 16 px between every pair of boxes', () => {
    const ids = [...BODY_REGION_IDS];
    const tooClose: string[] = [];
    ids.forEach((a: BodyRegionId, i) => {
      ids.slice(i + 1).forEach((b: BodyRegionId) => {
        if (gapBetween(HIT_AREAS[a], HIT_AREAS[b]) < 16) tooClose.push(`${a}/${b}`);
      });
    });
    expect(tooClose).toEqual([]);
  });

  it('gapBetween detects overlap and exact gaps', () => {
    expect(gapBetween({ left: 0, top: 0 }, { left: 50, top: 0 })).toBeLessThan(0);
    expect(gapBetween({ left: 0, top: 0 }, { left: 120, top: 0 })).toBe(16);
    expect(gapBetween({ left: 0, top: 120 }, { left: 0, top: 0 })).toBe(16);
  });
});
