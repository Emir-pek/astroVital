import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  computeMET,
  decimalsForStep,
  EARTH_DAY_SEC,
  fahrenheitToCelsius,
  formatMET,
  formatTimeInDay,
  highestEscalation,
  MARS_SOL_SEC,
  mgdlToMmol,
  missionDay,
  missionDayFor,
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

  it('missionDayFor: day 1 at mission start, default (Earth day) behaviour unchanged', () => {
    expect(missionDayFor(start, start)).toBe(1);
    expect(missionDayFor(start, start, MARS_SOL_SEC)).toBe(1);
    const now = new Date('2026-11-13T04:33:10Z');
    expect(missionDayFor(start, now)).toBe(missionDay(start, now));
    expect(missionDayFor(start, now, EARTH_DAY_SEC)).toBe(13);
  });

  it('missionDayFor: 30 Earth days ≈ 29 sols', () => {
    const after30Days = new Date(start.getTime() + 30 * 86_400_000);
    expect(missionDayFor(start, after30Days)).toBe(31); // 30 full days elapsed → day 31
    expect(missionDayFor(start, after30Days, MARS_SOL_SEC)).toBe(30); // 29.2 sols elapsed → sol 30
    expect(Math.floor((30 * 86_400) / MARS_SOL_SEC)).toBe(29);
  });

  it('missionDayFor: before mission start is 0 or negative', () => {
    expect(missionDayFor(start, new Date('2026-10-31T23:00:00Z'))).toBe(0);
    expect(missionDayFor(start, new Date('2026-10-30T12:00:00Z'))).toBe(-1);
    expect(missionDayFor(start, new Date('2026-10-31T23:00:00Z'), MARS_SOL_SEC)).toBe(0);
  });

  it('formatTimeInDay: time within the current day / sol', () => {
    expect(formatTimeInDay(start, new Date('2026-11-13T04:33:10Z'))).toBe('04:33:10');
    // Last second of sol 1: Earth clock is past midnight, sol clock reads 24:39:35.
    const endOfSol1 = new Date(start.getTime() + MARS_SOL_SEC * 1000 - 100);
    expect(formatTimeInDay(start, endOfSol1, MARS_SOL_SEC)).toBe('24:39:35');
    expect(missionDayFor(start, endOfSol1, MARS_SOL_SEC)).toBe(1);
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
    expect(worstStatus([])).toBe('nominal');
    expect(worstStatus(['nominal', 'advisory', 'warning', 'caution'])).toBe('warning');
    expect(worstStatus(['advisory', 'nominal'])).toBe('advisory');
    expect(worstStatus(['caution', 'advisory'])).toBe('caution');
    expect(highestEscalation(['self_care', 'flight_surgeon', 'crew_medical_officer'])).toBe(
      'flight_surgeon',
    );
  });
});
