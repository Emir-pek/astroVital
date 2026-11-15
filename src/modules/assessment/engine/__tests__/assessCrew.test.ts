import { describe, expect, it } from 'vitest';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { DEMO_CREW, generateHistory } from '@core/simulation';
import type { AssessmentContext, CrewMember, EnvironmentProfile, Measurement } from '@core/types';
import { assessCrew, emptySummary } from '../assessCrew';

const now = new Date('2026-11-14T22:00:00Z');

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

function measurement(metric: Measurement['metric'], value: number): Measurement {
  return {
    id: `${metric}-${value}`,
    crewId: CREW.id,
    metric,
    value,
    timestamp: '2026-11-14T08:00:00.000Z',
    source: 'simulated',
    environment: 'spacecraft',
  };
}

describe('assessCrew: shape', () => {
  it('evaluates every metric and groups assessments into all regions', () => {
    const history = [
      measurement('heartRate', 65),
      measurement('systolicBP', 115),
      measurement('diastolicBP', 75),
      measurement('bloodGlucose', 85),
      measurement('bodyTemp', 36.8),
      measurement('sleepHours', 7.5),
      measurement('mood', 4),
      measurement('spo2', 97),
      measurement('respRate', 15),
      measurement('radiationDose', 0.5),
      measurement('exerciseMinutes', 140),
    ];
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const s = assessCrew(CREW.id, history, ctx);
    expect(s.assessments).toHaveLength(11);
    expect(s.regions.map((r) => r.region)).toEqual([...BODY_REGION_IDS]);
    expect(s.overall).toBe('nominal');
    expect(s.escalation).toBe('self_care');
    expect(s.generatedAt).toBe(now.toISOString());
  });

  it('region contains the assessments of its metrics', () => {
    const history = [measurement('heartRate', 65), measurement('systolicBP', 115)];
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const s = assessCrew(CREW.id, history, ctx);
    const heart = s.regions.find((r) => r.region === 'heart')!;
    expect(heart.assessments.map((a) => a.metric)).toEqual(
      expect.arrayContaining(['heartRate', 'systolicBP']),
    );
  });

  it('emptySummary has no assessments', () => {
    const s = emptySummary('nobody', now);
    expect(s.assessments).toEqual([]);
    expect(s.regions).toHaveLength(BODY_REGION_IDS.length);
    expect(s.overall).toBe('nominal');
    expect(s.escalation).toBe('self_care');
  });
});

describe('docs/THRESHOLDS.md § Eskalasyon kuralı 3: ≥2 caution in one region → crew_medical_officer', () => {
  it('raises the crew escalation even though no single metric reached crew_medical_officer', () => {
    // heart region: heartRate + systolicBP + diastolicBP + exerciseMinutes. Two of them land
    // in a lone self_care caution band — individually neither needs the CMO.
    const history = [
      measurement('heartRate', 110), // caution, self_care
      measurement('systolicBP', 135), // caution, self_care
      measurement('diastolicBP', 75), // nominal
      measurement('exerciseMinutes', 140), // nominal
    ];
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const s = assessCrew(CREW.id, history, ctx);
    expect(s.assessments.find((a) => a.metric === 'heartRate')?.escalation).toBe('self_care');
    expect(s.assessments.find((a) => a.metric === 'systolicBP')?.escalation).toBe('self_care');
    expect(s.escalation).toBe('crew_medical_officer');
  });

  it('a single caution in a region does not raise the crew escalation', () => {
    const history = [measurement('heartRate', 110), measurement('systolicBP', 115)];
    const ctx: AssessmentContext = { environment: PLAIN_ENV, crew: CREW, history, now };
    const s = assessCrew(CREW.id, history, ctx);
    expect(s.escalation).toBe('self_care');
  });
});

describe('docs/DEMO_CREW_STORIES.md § Beklenen durum tablosu (mixed_mission, ISS, seed 2026)', () => {
  const history = generateHistory({
    seed: 2026,
    crew: DEMO_CREW,
    environment: ENVIRONMENTS.iss,
    scenario: 'mixed_mission',
    days: 30,
    end: now,
  });

  const summaryFor = (crewId: string) => {
    const crew = DEMO_CREW.find((c) => c.id === crewId)!;
    const ctx: AssessmentContext = { environment: ENVIRONMENTS.iss, crew, history, now };
    return assessCrew(crewId, history, ctx);
  };

  it('crew-1 Mira Okafor → nominal, self_care', () => {
    const s = summaryFor('crew-1');
    expect(s.overall).toBe('nominal');
    expect(s.escalation).toBe('self_care');
  });

  it('crew-2 Kenji Arata → warning, crew_medical_officer (fever + dehydration)', () => {
    const s = summaryFor('crew-2');
    expect(s.overall).toBe('warning');
    expect(s.escalation).toBe('crew_medical_officer');
    const temp = s.assessments.find((a) => a.metric === 'bodyTemp')!;
    expect(temp.status).toBe('warning');
  });

  it('crew-3 Selin Aydın → caution, self_care (slow isolation-driven decline)', () => {
    const s = summaryFor('crew-3');
    expect(s.overall).toBe('caution');
    expect(s.escalation).toBe('self_care');
  });

  it('crew-4 Lucas Moreau → nominal with today\'s band-only engine (personal-baseline "advisory" rule is ADR-031/P1, not yet implemented)', () => {
    const s = summaryFor('crew-4');
    expect(s.overall).toBe('nominal');
  });

  it('on Mars (autonomous), no result is ever left at flight_surgeon — it is upgraded to emergency', () => {
    const marsHistory = generateHistory({
      seed: 2026,
      crew: DEMO_CREW,
      environment: ENVIRONMENTS.mars_base,
      scenario: 'fever_dehydration',
      days: 10,
      end: now,
    });
    const crew = DEMO_CREW[1]!; // Kenji
    const ctx: AssessmentContext = {
      environment: ENVIRONMENTS.mars_base,
      crew,
      history: marsHistory,
      now,
    };
    const s = assessCrew(crew.id, marsHistory, ctx);
    expect(s.assessments.some((a) => a.escalation === 'flight_surgeon')).toBe(false);
  });
});
