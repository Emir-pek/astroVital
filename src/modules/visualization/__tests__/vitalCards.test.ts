import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS, METRICS } from '@core/config';
import type { Assessment, Measurement, MetricId, Status } from '@core/types';
import {
  PRIMARY_CARDS,
  buildVitalCards,
  gaugeBands,
  outOfRangeDirection,
  sortBySeverity,
} from '../services/vitalCards';

const now = new Date('2026-11-14T12:00:00Z');
const env = ENVIRONMENTS.iss;
const fresh = '2026-11-14T08:00:00Z';
const old = '2026-11-01T08:00:00Z';

const m = (metric: MetricId, value: number, timestamp = fresh): Measurement => ({
  id: `${metric}-1`,
  crewId: 'c1',
  metric,
  value,
  timestamp,
  source: 'keyboard',
  environment: 'iss',
});

const a = (metric: MetricId, status: Status, value = 1): Assessment => ({
  metric,
  crewId: 'c1',
  status,
  escalation: 'self_care',
  value,
  trend: 'unknown',
  summaryKey: 's',
  explanationKey: 'e',
  recommendations: [],
  sourceIds: [],
});

describe('buildVitalCards', () => {
  it('returns six empty cards for empty input', () => {
    const cards = buildVitalCards({ latest: {}, assessments: [], env, now });
    expect(cards.map((c) => c.id)).toEqual([...PRIMARY_CARDS]);
    expect(cards).toHaveLength(6);
    for (const c of cards) {
      expect(c.status).toBe('none');
      expect(c.values).toEqual([]);
    }
  });

  it('stale overrides an existing caution assessment', () => {
    const cards = buildVitalCards({
      latest: { heartRate: m('heartRate', 130, old) },
      assessments: [a('heartRate', 'caution')],
      env,
      now,
    });
    expect(cards.find((c) => c.id === 'heartRate')?.status).toBe('stale');
  });

  it('combines blood pressure metrics into one card', () => {
    const cards = buildVitalCards({
      latest: { systolicBP: m('systolicBP', 142), diastolicBP: m('diastolicBP', 88) },
      assessments: [a('systolicBP', 'caution', 142), a('diastolicBP', 'nominal', 88)],
      env,
      now,
    });
    const bp = cards.find((c) => c.id === 'bloodPressure');
    expect(bp?.status).toBe('caution');
    expect(bp?.values).toEqual([142, 88]);
    expect(bp?.metrics).toEqual(['systolicBP', 'diastolicBP']);
    expect(bp?.labelKey).toBe('visualization.vitals.bloodPressure');
    expect(bp?.measuredAt).toBe(fresh);
    expect(bp?.direction).toBe('up');
  });

  it('appends a non-primary metric card only when it is not nominal', () => {
    const base = { latest: { respRate: m('respRate', 25) }, env, now };
    const bad = buildVitalCards({ ...base, assessments: [a('respRate', 'caution', 25)] });
    expect(bad).toHaveLength(7);
    expect(bad[6]?.id).toBe('respRate');
    const ok = buildVitalCards({ ...base, assessments: [a('respRate', 'nominal', 16)] });
    expect(ok).toHaveLength(6);
  });
});

describe('outOfRangeDirection', () => {
  it('points up above and down below the nominal band', () => {
    expect(outOfRangeDirection('heartRate', 130)).toBe('up');
    expect(outOfRangeDirection('heartRate', 30)).toBe('down');
    expect(outOfRangeDirection('heartRate', 70)).toBeNull();
  });
});

describe('gaugeBands', () => {
  it('keeps every band within the metric range', () => {
    const { min, max } = METRICS.spo2;
    const bands = gaugeBands('spo2');
    expect(bands.length).toBeGreaterThan(0);
    for (const b of bands) {
      expect(b.from).toBeGreaterThanOrEqual(min);
      expect(b.to).toBeLessThanOrEqual(max);
      expect(b.from).toBeLessThan(b.to);
    }
  });

  it('has no gauge for cumulative radiation', () => {
    const cards = buildVitalCards({
      latest: { radiationDose: m('radiationDose', 400) },
      assessments: [a('radiationDose', 'caution', 400)],
      env,
      now,
    });
    expect(cards.find((c) => c.id === 'radiationDose')?.gauge).toBeNull();
  });
});

describe('sortBySeverity', () => {
  it('moves non-nominal cards to the top and keeps the primary order otherwise', () => {
    const latest = {
      heartRate: m('heartRate', 70),
      systolicBP: m('systolicBP', 118),
      diastolicBP: m('diastolicBP', 76),
      spo2: m('spo2', 97),
      bodyTemp: m('bodyTemp', 36.8, old),
      sleepHours: m('sleepHours', 5.1),
    };
    const assessments = [
      a('heartRate', 'nominal', 70),
      a('systolicBP', 'nominal', 118),
      a('diastolicBP', 'nominal', 76),
      a('spo2', 'warning', 97),
      a('bodyTemp', 'nominal', 36.8),
      a('sleepHours', 'caution', 5.1),
    ];
    const cards = sortBySeverity(buildVitalCards({ latest, assessments, env, now }));
    expect(cards.map((c) => [c.id, c.status])).toEqual([
      ['spo2', 'warning'],
      ['sleepHours', 'caution'],
      ['bodyTemp', 'stale'],
      ['mood', 'none'],
      ['heartRate', 'nominal'],
      ['bloodPressure', 'nominal'],
    ]);
  });

  it('does not mutate its input', () => {
    const cards = buildVitalCards({ latest: {}, assessments: [], env, now });
    const copy = [...cards];
    sortBySeverity(cards);
    expect(cards).toEqual(copy);
  });
});
