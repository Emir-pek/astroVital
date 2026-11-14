import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { BODY_REGION_IDS } from '@core/config/bodyRegions.config';
import { DEMO_CREW, generateHistory } from '@core/simulation';
import type { AssessmentContext, Measurement } from '@core/types';
import { assessCrew, assessMeasurement, emptySummary } from '../index';

/*
 * Phase-0 contract tests for the STUB engine. When Engineer 3 implements real rules,
 * keep the "shape" tests and replace the "always green" expectations with band tests
 * (target ≥ 90 % coverage of engine/).
 */
const now = new Date('2026-11-14T22:00:00Z');
const crew = DEMO_CREW[0]!;
const history: Measurement[] = generateHistory({
  seed: 1,
  crew: [crew],
  environment: ENVIRONMENTS.iss,
  scenario: 'nominal',
  days: 7,
  end: now,
});
const ctx: AssessmentContext = { environment: ENVIRONMENTS.iss, crew, history, now };

describe('assessMeasurement (stub)', () => {
  it('returns a well-formed green assessment', () => {
    const m = history.find((x) => x.metric === 'heartRate')!;
    const a = assessMeasurement(m, ctx);
    expect(a).toMatchObject({
      metric: 'heartRate',
      crewId: crew.id,
      status: 'green',
      escalation: 'self_care',
      value: m.value,
      measurementId: m.id,
    });
    expect(a.sourceIds.length).toBeGreaterThan(0);
  });
});

describe('assessCrew', () => {
  it('assesses the latest value of every metric and builds all regions', () => {
    const s = assessCrew(crew.id, history, ctx);
    expect(s.assessments).toHaveLength(11);
    expect(s.regions.map((r) => r.region)).toEqual([...BODY_REGION_IDS]);
    expect(s.overall).toBe('green');
    expect(s.escalation).toBe('self_care');
    expect(s.generatedAt).toBe(now.toISOString());
  });

  it('region contains the assessments of its metrics', () => {
    const s = assessCrew(crew.id, history, ctx);
    const heart = s.regions.find((r) => r.region === 'heart')!;
    expect(heart.assessments.map((a) => a.metric)).toEqual(
      expect.arrayContaining(['heartRate', 'systolicBP', 'diastolicBP', 'exerciseMinutes']),
    );
  });

  it('emptySummary has no assessments', () => {
    const s = emptySummary('nobody', now);
    expect(s.assessments).toEqual([]);
    expect(s.regions).toHaveLength(BODY_REGION_IDS.length);
  });
});
