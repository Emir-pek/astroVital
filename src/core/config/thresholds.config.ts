import type { MetricId, MetricThreshold } from '@core/types';

/**
 * DEFAULT THRESHOLDS — configurable starting values, NOT medical advice.
 * Engineer 3 validates every row against docs/SOURCES.md (Phase 3).
 *
 * Band semantics: half-open [min, max). Bands of a metric are contiguous, ordered low→high,
 * and cover (-∞, +∞). A unit test (core/config/__tests__) enforces this.
 * Human-readable table: docs/THRESHOLDS.md (keep in sync!).
 *
 * Generic message keys (thresholds.*) are interpolated with {{metric}} by the UI;
 * metric-specific explanations are added by the assessment module.
 */

/** NASA career effective dose limit (NASA-STD-3001 Vol 1 Rev B, 2022). */
export const CAREER_RADIATION_LIMIT_MSV = 600;
/** Daily dose above this multiple of the environment's expected dose ⇒ suspected SPE → shelter. */
export const RADIATION_SPE_DAILY_MULTIPLIER = 5;

const M = {
  normal: 'thresholds.normal',
  low: 'thresholds.low',
  high: 'thresholds.high',
  criticalLow: 'thresholds.criticalLow',
  criticalHigh: 'thresholds.criticalHigh',
  emergencyLow: 'thresholds.emergencyLow',
  emergencyHigh: 'thresholds.emergencyHigh',
} as const;

export const THRESHOLDS: Record<MetricId, MetricThreshold> = {
  systolicBP: {
    metric: 'systolicBP',
    bands: [
      // "<80 + symptoms" — symptom check is an assessment-engine rule (P1).
      { max: 80, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyLow },
      {
        min: 80,
        max: 85,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalLow,
      },
      { min: 85, max: 90, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 90, max: 130, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 130, max: 140, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 140,
        max: 180,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 180, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    trend: { windowDays: 7, deltaPct: 10, status: 'caution' },
    sourceIds: ['acc-aha-bp-2017', 'rcp-news2', 'nasa-hrp-risks'],
  },
  diastolicBP: {
    metric: 'diastolicBP',
    bands: [
      { max: 55, status: 'warning', escalation: 'crew_medical_officer', messageKey: M.criticalLow },
      { min: 55, max: 60, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 60, max: 85, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 85, max: 90, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 90,
        max: 120,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 120, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    sourceIds: ['acc-aha-bp-2017', 'nasa-hrp-risks'],
  },
  heartRate: {
    metric: 'heartRate',
    bands: [
      { max: 35, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyLow },
      {
        min: 35,
        max: 40,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalLow,
      },
      { min: 40, max: 50, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 50, max: 101, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 101, max: 121, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 121,
        max: 151,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 151, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    trend: { windowDays: 7, deltaPct: 15, status: 'caution' },
    sourceIds: ['rcp-news2', 'nasa-hrp-risks'],
  },
  bloodGlucose: {
    metric: 'bloodGlucose',
    bands: [
      // ADA level-2 hypoglycaemia < 54 mg/dL.
      { max: 54, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyLow },
      {
        min: 54,
        max: 60,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalLow,
      },
      { min: 60, max: 70, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 70, max: 100, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 100, max: 126, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 126,
        max: 250,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 250, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    sourceIds: ['ada-standards-glycemia', 'nasa-hrp-risks'],
  },
  bodyTemp: {
    metric: 'bodyTemp',
    bands: [
      {
        max: 35.5,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalLow,
      },
      { min: 35.5, max: 36.1, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 36.1, max: 37.5, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 37.5, max: 38.0, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 38.0,
        max: 39.5,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 39.5, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    sourceIds: ['rcp-news2', 'stahn-2017-core-temp'],
  },
  sleepHours: {
    metric: 'sleepHours',
    bands: [
      { max: 6, status: 'warning', escalation: 'self_care', messageKey: M.criticalLow },
      { min: 6, max: 7, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 7, max: 9, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      // > 9 h is not dangerous per se but may signal illness/fatigue (ADR-012).
      { min: 9, status: 'caution', escalation: 'self_care', messageKey: M.high },
    ],
    sustained: [
      {
        days: 3,
        max: 6.5,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: 'thresholds.sustained.shortSleep',
      },
      {
        days: 2,
        max: 4,
        status: 'warning',
        escalation: 'flight_surgeon',
        messageKey: 'thresholds.sustained.severeSleepLoss',
      },
    ],
    sourceIds: ['nsf-sleep-2015', 'nasa-hrp-risks'],
  },
  mood: {
    metric: 'mood',
    bands: [
      // "1 + isolation signs → flight surgeon" is a compound rule for the engine (P1).
      { max: 3, status: 'warning', escalation: 'crew_medical_officer', messageKey: M.criticalLow },
      { min: 3, max: 4, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 4, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
    ],
    // 3-day falling trend → warning.
    trend: { windowDays: 3, deltaPct: -25, status: 'warning' },
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-5-hazards'],
  },
  spo2: {
    metric: 'spo2',
    bands: [
      { max: 88, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyLow },
      {
        min: 88,
        max: 92,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalLow,
      },
      { min: 92, max: 95, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 95, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
    ],
    sourceIds: ['rcp-news2'],
  },
  respRate: {
    metric: 'respRate',
    bands: [
      { max: 10, status: 'warning', escalation: 'crew_medical_officer', messageKey: M.criticalLow },
      { min: 10, max: 12, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 12, max: 21, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
      { min: 21, max: 25, status: 'caution', escalation: 'self_care', messageKey: M.high },
      {
        min: 25,
        max: 31,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: M.criticalHigh,
      },
      { min: 31, status: 'warning', escalation: 'flight_surgeon', messageKey: M.emergencyHigh },
    ],
    sourceIds: ['rcp-news2'],
  },
  radiationDose: {
    metric: 'radiationDose',
    // Compared against priorRadiationMSv + Σ daily doses (career cumulative).
    basis: 'cumulativeSum',
    bands: [
      {
        max: CAREER_RADIATION_LIMIT_MSV * 0.5,
        status: 'nominal',
        escalation: 'self_care',
        messageKey: 'thresholds.radiation.underHalf',
      },
      {
        min: CAREER_RADIATION_LIMIT_MSV * 0.5,
        max: CAREER_RADIATION_LIMIT_MSV * 0.8,
        status: 'caution',
        escalation: 'self_care',
        messageKey: 'thresholds.radiation.halfToEighty',
      },
      {
        min: CAREER_RADIATION_LIMIT_MSV * 0.8,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: 'thresholds.radiation.overEighty',
      },
    ],
    // SPE rule (daily dose > RADIATION_SPE_DAILY_MULTIPLIER × expected) is evaluated by the engine
    // on the raw daily value → status warning, escalation flight_surgeon, recommendation radiation_shelter.
    sourceIds: ['nasa-std-3001', 'csa-radiation', 'zeitlin-2013-msl-rad'],
  },
  exerciseMinutes: {
    metric: 'exerciseMinutes',
    bands: [
      // Single low day = self-care (ADR-013); 3 days in a row → CMO via sustained rule.
      { max: 60, status: 'warning', escalation: 'self_care', messageKey: M.criticalLow },
      { min: 60, max: 120, status: 'caution', escalation: 'self_care', messageKey: M.low },
      { min: 120, status: 'nominal', escalation: 'self_care', messageKey: M.normal },
    ],
    sustained: [
      {
        days: 3,
        max: 60,
        status: 'warning',
        escalation: 'crew_medical_officer',
        messageKey: 'thresholds.sustained.noExercise',
      },
    ],
    sourceIds: ['nasa-iss-exercise', 'nasa-hrp-risks'],
  },
};
