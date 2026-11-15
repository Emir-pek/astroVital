import { describe, expect, it } from 'vitest';
import { buildRecommendations } from '../recommendations';

const groundSupport = { medicalCapability: 'full_ground_support' as const };
const autonomous = { medicalCapability: 'autonomous' as const };

describe('buildRecommendations', () => {
  it('returns nothing for a nominal result', () => {
    expect(
      buildRecommendations({
        metric: 'heartRate',
        status: 'nominal',
        escalation: 'self_care',
        isSolarParticleEvent: false,
        environment: groundSupport,
      }),
    ).toEqual([]);
  });

  it('caution + self_care: only the metric-category action, no contact, no remeasure', () => {
    const recs = buildRecommendations({
      metric: 'exerciseMinutes',
      status: 'caution',
      escalation: 'self_care',
      isSolarParticleEvent: false,
      environment: groundSupport,
    });
    expect(recs.map((r) => r.category)).toEqual(['exercise']);
  });

  it('warning + crew_medical_officer: category action, contact CMO, AND mandatory remeasure', () => {
    const recs = buildRecommendations({
      metric: 'bodyTemp',
      status: 'warning',
      escalation: 'crew_medical_officer',
      isSolarParticleEvent: false,
      environment: groundSupport,
    });
    expect(recs.map((r) => r.category)).toEqual(['hydration', 'contact_cmo', 'remeasure']);
    expect(recs.every((r) => r.urgency === 'warning')).toBe(true);
  });

  it('flight_surgeon escalation contacts the flight surgeon, not the CMO', () => {
    const recs = buildRecommendations({
      metric: 'spo2',
      status: 'warning',
      escalation: 'flight_surgeon',
      isSolarParticleEvent: false,
      environment: groundSupport,
    });
    expect(recs.map((r) => r.category)).toEqual([
      'medication_consult',
      'contact_flight_surgeon',
      'remeasure',
    ]);
  });

  it('on Mars (autonomous), the flight-surgeon contact uses the asynchronous-report steps', () => {
    const recs = buildRecommendations({
      metric: 'spo2',
      status: 'warning',
      escalation: 'emergency', // already upgraded by finalizeEscalation
      isSolarParticleEvent: false,
      environment: autonomous,
    });
    const contact = recs.find((r) => r.category === 'contact_flight_surgeon')!;
    expect(contact.stepsKeys).toEqual([
      'assessment.recommendations.contactFlightSurgeon.stepAutonomous1',
      'assessment.recommendations.contactFlightSurgeon.stepAutonomous2',
    ]);
  });

  it('a solar particle event gets the SPE-specific shelter wording, not the cumulative one', () => {
    const recs = buildRecommendations({
      metric: 'radiationDose',
      status: 'warning',
      escalation: 'flight_surgeon',
      isSolarParticleEvent: true,
      environment: groundSupport,
    });
    expect(recs[0]).toMatchObject({
      id: 'radiation-shelter-spe',
      category: 'radiation_shelter',
      titleKey: 'assessment.recommendations.radiationShelterSpe.title',
    });
  });

  it('a high cumulative dose (not SPE) gets the plain radiation-shelter wording', () => {
    const recs = buildRecommendations({
      metric: 'radiationDose',
      status: 'warning',
      escalation: 'crew_medical_officer',
      isSolarParticleEvent: false,
      environment: groundSupport,
    });
    expect(recs[0]).toMatchObject({
      id: 'radiation_shelter',
      titleKey: 'assessment.recommendations.radiationShelter.title',
    });
  });

  it('every recommendation id is unique within one result', () => {
    const recs = buildRecommendations({
      metric: 'bodyTemp',
      status: 'warning',
      escalation: 'flight_surgeon',
      isSolarParticleEvent: false,
      environment: autonomous,
    });
    expect(new Set(recs.map((r) => r.id)).size).toBe(recs.length);
  });
});
