import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { RADIATION_SPE_DAILY_MULTIPLIER, THRESHOLDS } from '@core/config/thresholds.config';
import type {
  AssessmentContext,
  CrewMember,
  EnvironmentProfile,
  Measurement,
  MetricId,
} from '@core/types';
import { assessMeasurement } from '../assessMeasurement';

/** Environment with NO threshold modifiers — isolates pure band behaviour from env shifts. */
const PLAIN_ENV: EnvironmentProfile = {
  id: 'spacecraft',
  labelKey: 'x',
  descriptionKey: 'x',
  gravityG: 0,
  expectedDailyRadiationMSv: 0.5,
  oneWayCommDelaySec: [0, 1],
  evacuationTimeHours: 24,
  medicalCapability: 'full_ground_support',
  thresholdModifiers: {},
  reminderSchedule: [],
  sourceIds: [],
};

const CREW: CrewMember = {
  id: 'crew-x',
  name: 'Test Crew',
  role: 'Test',
  age: 40,
  sex: 'F',
  avatarColor: '#fff',
  baseline: {},
};

const now = new Date('2026-11-14T22:00:00Z');

function measurement(
  metric: MetricId,
  value: number,
  timestamp = '2026-11-14T08:00:00.000Z',
): Measurement {
  return {
    id: `${metric}-${value}`,
    crewId: CREW.id,
    metric,
    value,
    timestamp,
    source: 'simulated',
    environment: 'spacecraft',
  };
}

/** Single-measurement assessment — no history, so trend/sustained stay 'unknown'/unset. */
function assess(
  metric: MetricId,
  value: number,
  opts: Partial<Pick<AssessmentContext, 'environment' | 'crew' | 'now'>> = {},
) {
  const m = measurement(metric, value);
  const ctx: AssessmentContext = {
    environment: opts.environment ?? PLAIN_ENV,
    crew: opts.crew ?? CREW,
    history: [m],
    now: opts.now ?? now,
  };
  return assessMeasurement(m, ctx);
}

describe('assessMeasurement: every band of every metric (no environment modifier)', () => {
  for (const [metric, threshold] of Object.entries(THRESHOLDS) as [
    MetricId,
    (typeof THRESHOLDS)[MetricId],
  ][]) {
    if (threshold.basis === 'cumulativeSum') continue; // radiation covered separately below
    for (const band of threshold.bands) {
      const probe = band.min ?? (band.max ?? 0) - 1;
      it(`${metric} @ ${probe} → ${band.status}/${band.escalation}`, () => {
        const a = assess(metric, probe);
        expect(a.status).toBe(band.status);
        expect(a.escalation).toBe(band.escalation);
        expect(a.summaryKey).toBe(band.messageKey);
      });
    }
  }
});

describe('the reported bug: fever reads warning, not nominal', () => {
  it('38.5 °C on the ISS (shift +0.3) is warning, crew_medical_officer', () => {
    const a = assess('bodyTemp', 38.5, { environment: ENVIRONMENTS.iss });
    expect(a.status).toBe('warning');
    expect(a.escalation).toBe('crew_medical_officer');
  });

  it('37.6 °C on the ISS stays nominal because of the +0.3 shift', () => {
    const a = assess('bodyTemp', 37.6, { environment: ENVIRONMENTS.iss });
    expect(a.status).toBe('nominal');
  });

  it('37.6 °C with no environment shift is caution', () => {
    const a = assess('bodyTemp', 37.6, { environment: PLAIN_ENV });
    expect(a.status).toBe('caution');
  });
});

describe('environment modifiers reach the engine end-to-end', () => {
  it("rover's narrower respRate band (widen -1) turns 12/min caution instead of nominal", () => {
    const plain = assess('respRate', 12, { environment: PLAIN_ENV });
    expect(plain.status).toBe('nominal');
    const rover = assess('respRate', 12, { environment: ENVIRONMENTS.rover });
    expect(rover.status).toBe('caution');
  });
});

describe('radiationDose: cumulativeSum basis', () => {
  it('bands the career-cumulative value, not the daily reading', () => {
    // expectedDailyRadiationMSv raised so this day's dose stays well under the SPE multiplier
    // (5×) — isolates the cumulative-band behaviour from the SPE override below.
    const environment: EnvironmentProfile = { ...PLAIN_ENV, expectedDailyRadiationMSv: 5 };
    const crew: CrewMember = { ...CREW, priorRadiationMSv: 295 };
    const history: Measurement[] = [measurement('radiationDose', 10, '2026-11-14T19:30:00.000Z')];
    const ctx: AssessmentContext = { environment, crew, history, now };
    const a = assessMeasurement(history[0]!, ctx);
    // 295 + 10 = 305 ≥ 300 (50 % of the 600 mSv career limit) → caution.
    expect(a.value).toBeCloseTo(305);
    expect(a.status).toBe('caution');
  });

  it('a solar particle event overrides the band outright: warning, flight_surgeon, shelter', () => {
    const a = assess('radiationDose', 3, { environment: ENVIRONMENTS.iss }); // iss expects 0.5 msv/day
    expect(a.status).toBe('warning');
    expect(a.escalation).toBe('flight_surgeon');
    expect(a.summaryKey).toBe('assessment.radiation.spe');
    expect(a.recommendations[0]).toMatchObject({
      id: 'radiation-shelter-spe',
      category: 'radiation_shelter',
    });
  });

  it('a daily dose just at the SPE multiplier is NOT flagged (exclusive)', () => {
    const borderline = RADIATION_SPE_DAILY_MULTIPLIER * ENVIRONMENTS.iss.expectedDailyRadiationMSv;
    const a = assess('radiationDose', borderline, { environment: ENVIRONMENTS.iss });
    expect(a.summaryKey).not.toBe('assessment.radiation.spe');
  });
});

describe('Mars (autonomous) escalation upgrade', () => {
  it('a flight_surgeon-tier result becomes emergency on an autonomous environment', () => {
    const a = assess('bodyTemp', 40, { environment: ENVIRONMENTS.mars_base });
    expect(a.escalation).toBe('emergency');
    const contact = a.recommendations.find((r) => r.category === 'contact_flight_surgeon')!;
    expect(contact.stepsKeys).toEqual([
      'assessment.recommendations.contactFlightSurgeon.stepAutonomous1',
      'assessment.recommendations.contactFlightSurgeon.stepAutonomous2',
    ]);
  });

  it('the SAME value with ground support stays flight_surgeon (no upgrade)', () => {
    const a = assess('bodyTemp', 40, { environment: ENVIRONMENTS.iss });
    expect(a.escalation).toBe('flight_surgeon');
  });

  it('a crew_medical_officer-tier result is NOT upgraded on Mars (CMO is already on board)', () => {
    const a = assess('bodyTemp', 38.5, { environment: ENVIRONMENTS.mars_base });
    expect(a.escalation).toBe('crew_medical_officer');
  });
});

describe('sustained rules upgrade the result', () => {
  it('3 days in a row under 6.5 h sleep → warning, crew_medical_officer, even though a single reading would be caution', () => {
    const history: Measurement[] = [
      measurement('sleepHours', 6.2, '2026-11-12T06:15:00.000Z'),
      measurement('sleepHours', 6.0, '2026-11-13T06:15:00.000Z'),
      measurement('sleepHours', 6.3, '2026-11-14T06:15:00.000Z'),
    ];
    const latest = history[history.length - 1]!;
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const a = assessMeasurement(latest, ctx);
    expect(a.status).toBe('warning');
    expect(a.escalation).toBe('crew_medical_officer');
  });
});

describe('trend rules upgrade the result', () => {
  it('a 7-day +15 % rise in heart rate reads caution even inside the nominal band', () => {
    const history: Measurement[] = [
      measurement('heartRate', 60, '2026-11-07T06:30:00.000Z'),
      measurement('heartRate', 70, '2026-11-14T06:30:00.000Z'),
    ];
    const latest = history[history.length - 1]!;
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const a = assessMeasurement(latest, ctx);
    expect(a.trend).toBe('worsening');
    expect(a.status).toBe('caution');
  });
});

describe('recommendations', () => {
  it('a nominal result gets no recommendations', () => {
    const a = assess('heartRate', 70);
    expect(a.recommendations).toEqual([]);
  });

  it('every warning result includes the mandatory "remeasure" recommendation', () => {
    const a = assess('bodyTemp', 38.5, { environment: ENVIRONMENTS.iss });
    expect(a.recommendations.some((r) => r.category === 'remeasure')).toBe(true);
  });

  it('a caution/self_care result has no "remeasure" and no contact entry', () => {
    const a = assess('exerciseMinutes', 90);
    expect(a.recommendations.map((r) => r.category)).toEqual(['exercise']);
  });
});

describe('messageParams carries the measured value, rounded to the metric step', () => {
  it('bodyTemp (step 0.1)', () => {
    const a = assess('bodyTemp', 38.46);
    expect(a.messageParams?.value).toBeCloseTo(38.5);
  });
});
