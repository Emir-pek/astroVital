import { describe, expect, it } from 'vitest';
import type { Measurement } from '@core/types';
import { cumulativeRadiation, isSolarParticleEvent } from '../radiation';

function dose(timestamp: string, value: number): Measurement {
  return {
    id: timestamp,
    crewId: 'crew-x',
    metric: 'radiationDose',
    value,
    timestamp,
    source: 'simulated',
    environment: 'iss',
  };
}

describe('cumulativeRadiation', () => {
  it('adds prior career dose to the sum of daily doses up to the cutoff', () => {
    const history = [
      dose('2026-11-01T19:30:00Z', 0.5),
      dose('2026-11-02T19:30:00Z', 0.5),
      dose('2026-11-03T19:30:00Z', 0.5), // after the cutoff below — excluded
    ];
    const total = cumulativeRadiation({ priorRadiationMSv: 100 }, history, '2026-11-02T19:30:00Z');
    expect(total).toBeCloseTo(101);
  });

  it('defaults prior dose to 0 when unset', () => {
    const total = cumulativeRadiation(
      {},
      [dose('2026-11-01T19:30:00Z', 2)],
      '2026-11-01T19:30:00Z',
    );
    expect(total).toBe(2);
  });

  it('ignores measurements of other metrics', () => {
    const history: Measurement[] = [
      dose('2026-11-01T19:30:00Z', 1),
      { ...dose('2026-11-01T20:00:00Z', 999), metric: 'heartRate' },
    ];
    expect(cumulativeRadiation({ priorRadiationMSv: 0 }, history, '2026-11-01T20:00:00Z')).toBe(1);
  });
});

describe('isSolarParticleEvent', () => {
  it('flags a daily dose over 5x the expected dose', () => {
    expect(isSolarParticleEvent(3, 0.5, 5)).toBe(true); // 3 > 2.5
  });

  it('does not flag a normal daily dose', () => {
    expect(isSolarParticleEvent(0.6, 0.5, 5)).toBe(false);
  });

  it('is exclusive at exactly the multiplier', () => {
    expect(isSolarParticleEvent(2.5, 0.5, 5)).toBe(false);
  });
});
