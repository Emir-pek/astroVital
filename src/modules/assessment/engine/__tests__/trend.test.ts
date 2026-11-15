import { describe, expect, it } from 'vitest';
import type { Measurement } from '@core/types';
import { dailyLastValues, evaluateTrend, isMonotonicWorsening } from '../trend';

const now = new Date('2026-11-14T22:00:00Z');

function measurement(day: string, value: number, hour = '08:00'): Measurement {
  return {
    id: `${day}-${value}`,
    crewId: 'crew-x',
    metric: 'heartRate',
    value,
    timestamp: `${day}T${hour}:00.000Z`,
    source: 'simulated',
    environment: 'iss',
  };
}

describe('dailyLastValues', () => {
  it('keeps the LAST measurement of each UTC day', () => {
    const history = [
      measurement('2026-11-01', 60, '06:00'),
      measurement('2026-11-01', 70, '20:00'), // later same day — wins
      measurement('2026-11-02', 65, '06:00'),
    ];
    expect(dailyLastValues(history, now)).toEqual([
      { date: '2026-11-01', value: 70 },
      { date: '2026-11-02', value: 65 },
    ]);
  });

  it('ignores measurements timestamped after `now`', () => {
    const history = [measurement('2026-11-01', 60), measurement('2099-01-01', 999)];
    expect(dailyLastValues(history, now)).toEqual([{ date: '2026-11-01', value: 60 }]);
  });

  it('returns dates in ascending order regardless of input order', () => {
    const history = [measurement('2026-11-03', 1), measurement('2026-11-01', 2)];
    expect(dailyLastValues(history, now).map((d) => d.date)).toEqual(['2026-11-01', '2026-11-03']);
  });
});

describe('evaluateTrend', () => {
  it('is unknown with no trend config', () => {
    expect(evaluateTrend(undefined, [{ date: '2026-11-01', value: 60 }])).toEqual({
      trend: 'unknown',
    });
  });

  it('is unknown with fewer than two data points', () => {
    expect(
      evaluateTrend({ windowDays: 7, deltaPct: 15, status: 'caution' }, [
        { date: '2026-11-01', value: 60 },
      ]),
    ).toEqual({ trend: 'unknown' });
  });

  it('detects a worsening rise (heart rate +15% over 7 days → caution)', () => {
    const daily = [
      { date: '2026-11-07', value: 60 },
      { date: '2026-11-14', value: 70 }, // +16.7%
    ];
    expect(evaluateTrend({ windowDays: 7, deltaPct: 15, status: 'caution' }, daily)).toEqual({
      trend: 'worsening',
      statusOverride: 'caution',
    });
  });

  it('a rise just under the threshold is stable, not worsening', () => {
    const daily = [
      { date: '2026-11-07', value: 60 },
      { date: '2026-11-14', value: 68 }, // +13.3%, under 15%
    ];
    expect(evaluateTrend({ windowDays: 7, deltaPct: 15, status: 'caution' }, daily).trend).toBe(
      'stable',
    );
  });

  it('a fall of the same magnitude is improving', () => {
    const daily = [
      { date: '2026-11-07', value: 70 },
      { date: '2026-11-14', value: 59 }, // -15.7%
    ];
    expect(evaluateTrend({ windowDays: 7, deltaPct: 15, status: 'caution' }, daily).trend).toBe(
      'improving',
    );
  });

  it('detects a worsening FALL for a negative deltaPct (mood -25% over 3 days → warning)', () => {
    const daily = [
      { date: '2026-11-12', value: 4 },
      { date: '2026-11-14', value: 3 }, // -25%
    ];
    expect(evaluateTrend({ windowDays: 3, deltaPct: -25, status: 'warning' }, daily)).toEqual({
      trend: 'worsening',
      statusOverride: 'warning',
    });
  });

  it('a rise is "improving" (not worsening) when deltaPct is negative', () => {
    const daily = [
      { date: '2026-11-12', value: 3 },
      { date: '2026-11-14', value: 4 },
    ];
    expect(evaluateTrend({ windowDays: 3, deltaPct: -25, status: 'warning' }, daily).trend).toBe(
      'improving',
    );
  });

  it('ignores data points outside the window', () => {
    const daily = [
      { date: '2026-10-01', value: 10 }, // far outside the 7-day window
      { date: '2026-11-08', value: 60 },
      { date: '2026-11-14', value: 70 },
    ];
    expect(evaluateTrend({ windowDays: 7, deltaPct: 15, status: 'caution' }, daily)).toEqual({
      trend: 'worsening',
      statusOverride: 'caution',
    });
  });
});

describe('isMonotonicWorsening', () => {
  it('is true when each of the last 3 points increased (positive deltaPct = increase is worse)', () => {
    const daily = [
      { date: '2026-11-25', value: 60 },
      { date: '2026-11-26', value: 65 },
      { date: '2026-11-27', value: 70 },
    ];
    expect(isMonotonicWorsening(daily, 15)).toBe(true);
  });

  it('is false when one step does not increase', () => {
    const daily = [
      { date: '2026-11-25', value: 60 },
      { date: '2026-11-26', value: 58 },
      { date: '2026-11-27', value: 70 },
    ];
    expect(isMonotonicWorsening(daily, 15)).toBe(false);
  });

  it('is true for 3 consecutive FALLS when deltaPct is negative (mood)', () => {
    const daily = [
      { date: '2026-11-25', value: 4 },
      { date: '2026-11-26', value: 3 },
      { date: '2026-11-27', value: 2 },
    ];
    expect(isMonotonicWorsening(daily, -25)).toBe(true);
  });

  it('is false with fewer than `count` points', () => {
    expect(isMonotonicWorsening([{ date: '2026-11-27', value: 70 }], 15)).toBe(false);
  });
});
