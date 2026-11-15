import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config';
import { MS_PER_HOUR, isStale, maxValidityMs } from '../index';

const now = new Date('2026-11-14T12:00:00Z');

describe('staleness', () => {
  it('derives max validity from the shortest schedule interval x 1.5', () => {
    expect(maxValidityMs('heartRate', ENVIRONMENTS.iss)).toBe(36 * MS_PER_HOUR);
    expect(maxValidityMs('spo2', ENVIRONMENTS.rover)).toBe(18 * MS_PER_HOUR);
    expect(maxValidityMs('bloodGlucose', ENVIRONMENTS.iss)).toBe(252 * MS_PER_HOUR);
  });

  it('falls back to 48 h for unscheduled metrics', () => {
    // ISS schedules every metric since ADR-048; the rover schedule has no respiration item.
    expect(maxValidityMs('respRate', ENVIRONMENTS.rover)).toBe(48 * MS_PER_HOUR);
  });

  it('uses the systolic schedule for diastolic', () => {
    expect(maxValidityMs('diastolicBP', ENVIRONMENTS.iss)).toBe(
      maxValidityMs('systolicBP', ENVIRONMENTS.iss),
    );
  });

  it('is stale only strictly beyond the validity window', () => {
    expect(isStale('2026-11-13T00:00:00Z', 'heartRate', ENVIRONMENTS.iss, now)).toBe(false);
    expect(isStale('2026-11-12T23:59:00Z', 'heartRate', ENVIRONMENTS.iss, now)).toBe(true);
  });
});

describe('isStale fail-safe', () => {
  it('treats an unparseable timestamp as stale', () => {
    expect(isStale('not-a-date', 'heartRate', ENVIRONMENTS.iss, now)).toBe(true);
  });
});
