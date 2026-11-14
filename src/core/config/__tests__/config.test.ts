import { describe, expect, it } from 'vitest';
import {
  BODY_REGION_IDS,
  BODY_REGIONS,
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  HAZARD_IDS,
  HAZARDS,
  isKnownSource,
  METRIC_IDS,
  METRICS,
  THRESHOLDS,
} from '@core/config';
import { parseTimeOfDay } from '@core/utils/time';

describe('thresholds.config', () => {
  it.each(METRIC_IDS)('%s bands are ordered, contiguous and cover (-∞, +∞)', (id) => {
    const { bands } = THRESHOLDS[id];
    expect(bands.length).toBeGreaterThan(0);
    expect(bands[0]?.min).toBeUndefined();
    expect(bands[bands.length - 1]?.max).toBeUndefined();
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]?.min, `gap/overlap between band ${i - 1} and ${i}`).toBe(bands[i - 1]?.max);
    }
  });

  it.each(METRIC_IDS)('%s has exactly one green band and known sourceIds', (id) => {
    const t = THRESHOLDS[id];
    expect(t.bands.filter((b) => b.status === 'green')).toHaveLength(1);
    expect(t.sourceIds.length).toBeGreaterThan(0);
    t.sourceIds.forEach((s) => expect(isKnownSource(s), s).toBe(true));
  });
});

describe('every sourceId used in config exists in the registry', () => {
  it('hazards, body regions, environments', () => {
    const ids = [
      ...HAZARD_IDS.flatMap((h) => HAZARDS[h].sourceIds),
      ...BODY_REGION_IDS.flatMap((r) => BODY_REGIONS[r].sourceIds),
      ...ENVIRONMENT_IDS.flatMap((e) => ENVIRONMENTS[e].sourceIds),
    ];
    ids.forEach((s) => expect(isKnownSource(s), s).toBe(true));
  });
});

describe('metrics & regions', () => {
  it('every metric maps to at least one region and one hazard; bounds are sane', () => {
    for (const id of METRIC_IDS) {
      const m = METRICS[id];
      expect(m.bodyRegions.length).toBeGreaterThan(0);
      expect(m.hazards.length).toBeGreaterThan(0);
      expect(m.min).toBeLessThan(m.max);
      expect(m.step).toBeGreaterThan(0);
    }
  });

  it('region metric lists are derived from METRICS', () => {
    expect(BODY_REGIONS.heart.metrics).toContain('heartRate');
    expect(BODY_REGIONS.brain.metrics).toEqual(expect.arrayContaining(['sleepHours', 'mood']));
  });
});

describe('environments', () => {
  it('reminder times are valid HH:mm and ids unique per environment', () => {
    for (const id of ENVIRONMENT_IDS) {
      const schedule = ENVIRONMENTS[id].reminderSchedule;
      schedule.forEach((r) => expect(() => parseTimeOfDay(r.timeOfDayMET)).not.toThrow());
      expect(new Set(schedule.map((r) => r.id)).size).toBe(schedule.length);
    }
  });

  it('gravity and comm delay are physically ordered', () => {
    expect(ENVIRONMENTS.mars_base.gravityG).toBeGreaterThan(ENVIRONMENTS.lunar_base.gravityG);
    expect(ENVIRONMENTS.mars_base.medicalCapability).toBe('autonomous');
    for (const id of ENVIRONMENT_IDS) {
      const [min, max] = ENVIRONMENTS[id].oneWayCommDelaySec;
      expect(min).toBeLessThanOrEqual(max);
    }
  });
});
