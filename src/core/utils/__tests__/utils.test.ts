import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  computeMET,
  decimalsForStep,
  fahrenheitToCelsius,
  formatMET,
  highestEscalation,
  mgdlToMmol,
  missionDay,
  mmolToMgdl,
  parseTimeOfDay,
  roundToStep,
  toCanonical,
  toDisplay,
  worstStatus,
} from '@core/utils';

describe('time (MET)', () => {
  const start = new Date('2026-11-01T00:00:00Z');

  it('computes and formats mission elapsed time', () => {
    const now = new Date('2026-11-13T04:33:10Z');
    expect(formatMET(computeMET(start, now))).toBe('012/04:33:10');
    expect(missionDay(start, now)).toBe(13);
  });

  it('handles pre-launch (negative) MET', () => {
    const parts = computeMET(start, new Date('2026-10-31T23:00:00Z'));
    expect(parts.negative).toBe(true);
    expect(formatMET(parts)).toBe('-000/01:00:00');
  });

  it('parses HH:mm and rejects garbage', () => {
    expect(parseTimeOfDay('07:30')).toBe(450);
    expect(() => parseTimeOfDay('24:00')).toThrow();
    expect(() => parseTimeOfDay('7:30')).toThrow();
  });
});

describe('units', () => {
  it('round-trips temperature and glucose', () => {
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 5);
    expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37, 5);
    expect(mgdlToMmol(mmolToMgdl(5.5))).toBeCloseTo(5.5, 8);
  });

  it('converts only at the UI edge, storage stays canonical', () => {
    const prefs = { temperature: 'F', glucose: 'mmol/L' } as const;
    expect(toDisplay('bodyTemp', 37, '°C', prefs)).toEqual({
      value: expect.closeTo(98.6, 5),
      unit: '°F',
    });
    expect(toCanonical('bloodGlucose', 5, prefs)).toBeCloseTo(90.08, 2);
    expect(toDisplay('heartRate', 60, 'bpm', prefs)).toEqual({ value: 60, unit: 'bpm' });
  });
});

describe('format', () => {
  it('derives decimals from step and rounds', () => {
    expect(decimalsForStep(1)).toBe(0);
    expect(decimalsForStep(0.1)).toBe(1);
    expect(decimalsForStep(0.25)).toBe(2);
    expect(roundToStep(36.6999999, 0.1)).toBe(36.7);
  });
});

describe('status', () => {
  it('worst status / highest escalation', () => {
    expect(worstStatus([])).toBe('green');
    expect(worstStatus(['green', 'red', 'yellow'])).toBe('red');
    expect(highestEscalation(['self_care', 'flight_surgeon', 'crew_medical_officer'])).toBe(
      'flight_surgeon',
    );
  });
});
