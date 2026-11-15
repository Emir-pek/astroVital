import { describe, expect, it } from 'vitest';
import { THRESHOLDS } from '@core/config/thresholds.config';
import type { DailyPoint } from '../trend';
import { evaluateSustained } from '../sustained';

const day = (date: string, value: number): DailyPoint => ({ date, value });

describe('evaluateSustained', () => {
  it('is undefined when there are no rules', () => {
    expect(evaluateSustained(undefined, [day('2026-11-01', 5)])).toBeUndefined();
  });

  it('matches "sleep < 6.5 h for 3 days in a row" → warning, CMO', () => {
    const daily = [day('2026-11-11', 6.2), day('2026-11-12', 6.0), day('2026-11-13', 6.3)];
    const rule = evaluateSustained(THRESHOLDS.sleepHours.sustained, daily);
    expect(rule).toMatchObject({ status: 'warning', escalation: 'crew_medical_officer', days: 3 });
  });

  it('does not match when only 2 of the 3 days qualify', () => {
    const daily = [day('2026-11-11', 6.2), day('2026-11-12', 7.0), day('2026-11-13', 6.3)];
    expect(evaluateSustained(THRESHOLDS.sleepHours.sustained, daily)).toBeUndefined();
  });

  it('does not match across a gap in days (not consecutive)', () => {
    const daily = [day('2026-11-10', 6.0), day('2026-11-12', 6.0), day('2026-11-13', 6.0)];
    expect(evaluateSustained(THRESHOLDS.sleepHours.sustained, daily)).toBeUndefined();
  });

  it('Selin: 6.7–6.9 h average stays clear of the 6.5 h sustained rule', () => {
    const daily = [day('2026-11-11', 6.9), day('2026-11-12', 6.7), day('2026-11-13', 6.8)];
    expect(evaluateSustained(THRESHOLDS.sleepHours.sustained, daily)).toBeUndefined();
  });

  it('picks the worse of two matching rules (2-day severe loss beats 3-day short sleep)', () => {
    const daily = [day('2026-11-11', 3.5), day('2026-11-12', 3.2), day('2026-11-13', 3.8)];
    const rule = evaluateSustained(THRESHOLDS.sleepHours.sustained, daily);
    expect(rule).toMatchObject({ status: 'warning', escalation: 'flight_surgeon', days: 2 });
  });

  it('exercise: 3 days in a row under 60 min → warning, CMO', () => {
    const daily = [day('2026-11-28', 10), day('2026-11-29', 0), day('2026-11-30', 20)];
    const rule = evaluateSustained(THRESHOLDS.exerciseMinutes.sustained, daily);
    expect(rule).toMatchObject({ status: 'warning', escalation: 'crew_medical_officer', days: 3 });
  });
});
