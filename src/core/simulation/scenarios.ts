import type { EnvironmentId, EnvironmentProfile, MetricId, ScenarioId } from '@core/types';

export interface ScenarioContext {
  /** 0-based day in the generated window (0 = mission start). */
  dayIndex: number;
  days: number;
  /** Index of the crew member in the crew list (scenarios may target one person). */
  crewIndex: number;
  environment: EnvironmentProfile;
}

/** Effect of a scenario on one metric on one day: value' = value * mul + add. */
export interface ScenarioEffect {
  add?: number;
  mul?: number;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  labelKey: string;
  descriptionKey: string;
  /** Environment that best showcases the scenario (Settings may auto-select it). */
  recommendedEnvironment: EnvironmentId;
  effect(metric: MetricId, ctx: ScenarioContext): ScenarioEffect;
}

const NONE: ScenarioEffect = {};

/** Linear ramp 0→1 over the window [from, to] (inclusive), 0 before, 1 after. */
const ramp = (x: number, from: number, to: number): number =>
  x <= from ? 0 : x >= to ? 1 : (x - from) / (to - from);

const scenario = (
  def: Omit<ScenarioDefinition, 'labelKey' | 'descriptionKey'>,
): ScenarioDefinition => ({
  ...def,
  labelKey: `scenarios.${def.id}.label`,
  descriptionKey: `scenarios.${def.id}.description`,
});

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  nominal: scenario({
    id: 'nominal',
    recommendedEnvironment: 'iss',
    effect: () => NONE,
  }),

  /** First 3 days: space motion sickness, headward fluid shift, poor sleep. */
  space_adaptation: scenario({
    id: 'space_adaptation',
    recommendedEnvironment: 'iss',
    effect: (metric, { dayIndex }) => {
      if (dayIndex >= 3) return NONE;
      const k = (3 - dayIndex) / 3; // 1 → 0.33
      switch (metric) {
        case 'heartRate':
          return { add: 9 * k };
        case 'systolicBP':
          return { add: -6 * k };
        case 'diastolicBP':
          return { add: -3 * k };
        case 'sleepHours':
          return { add: -2.2 * k };
        case 'mood':
          return { add: -1.3 * k };
        case 'bloodGlucose':
          return { add: -6 * k };
        case 'exerciseMinutes':
          return { mul: 1 - 0.8 * k };
        default:
          return NONE;
      }
    },
  }),

  /** Solar particle event 2 days before "now": dose spike, sheltering disrupts sleep. */
  solar_particle_event: scenario({
    id: 'solar_particle_event',
    recommendedEnvironment: 'spacecraft',
    effect: (metric, { dayIndex, days }) => {
      const peak = days - 3;
      const onPeak = dayIndex === peak;
      const after = dayIndex === peak + 1;
      if (!onPeak && !after) return NONE;
      switch (metric) {
        case 'radiationDose':
          return { mul: onPeak ? 14 : 4 };
        case 'sleepHours':
          return { add: onPeak ? -1.8 : -0.8 };
        case 'mood':
          return { add: -0.8 };
        case 'exerciseMinutes':
          return { mul: onPeak ? 0.2 : 0.6 };
        default:
          return NONE;
      }
    },
  }),

  /** Mars transit: progressive sleep & mood decline over the last 60% of the window. */
  isolation_stress: scenario({
    id: 'isolation_stress',
    recommendedEnvironment: 'spacecraft',
    effect: (metric, { dayIndex, days, crewIndex }) => {
      const intensity = [1, 0.35, 0.7, 0.2][crewIndex % 4] ?? 0.5;
      const k = ramp(dayIndex, days * 0.4, days - 1) * intensity;
      if (k === 0) return NONE;
      switch (metric) {
        case 'sleepHours':
          return { add: -2.0 * k };
        case 'mood':
          return { add: -2.4 * k };
        case 'heartRate':
          return { add: 7 * k };
        case 'systolicBP':
          return { add: 6 * k };
        case 'exerciseMinutes':
          return { add: -55 * k };
        default:
          return NONE;
      }
    },
  }),

  /** Crew member #2 develops fever + dehydration over the last 3 days. */
  fever_dehydration: scenario({
    id: 'fever_dehydration',
    recommendedEnvironment: 'lunar_base',
    effect: (metric, { dayIndex, days, crewIndex }) => {
      if (crewIndex !== 1) return NONE;
      const k = ramp(dayIndex, days - 4, days - 1);
      if (k === 0) return NONE;
      switch (metric) {
        case 'bodyTemp':
          return { add: 2.1 * k };
        case 'heartRate':
          return { add: 30 * k };
        case 'respRate':
          return { add: 6 * k };
        case 'spo2':
          return { add: -3 * k };
        case 'systolicBP':
          return { add: -12 * k };
        case 'diastolicBP':
          return { add: -7 * k };
        case 'sleepHours':
          return { add: -1.6 * k };
        case 'mood':
          return { add: -1.4 * k };
        case 'bloodGlucose':
          return { add: 14 * k };
        case 'exerciseMinutes':
          return { mul: 1 - 0.85 * k };
        default:
          return NONE;
      }
    },
  }),

  /** Return to gravity (last 2 days): orthostatic intolerance — BP drops, HR climbs. */
  orthostatic_return: scenario({
    id: 'orthostatic_return',
    recommendedEnvironment: 'mars_base',
    effect: (metric, { dayIndex, days, crewIndex }) => {
      if (dayIndex < days - 2) return NONE;
      const intensity = [0.6, 1, 0.5, 0.9][crewIndex % 4] ?? 0.7;
      switch (metric) {
        case 'systolicBP':
          return { add: -30 * intensity };
        case 'diastolicBP':
          return { add: -14 * intensity };
        case 'heartRate':
          return { add: 30 * intensity };
        case 'mood':
          return { add: -0.6 * intensity };
        case 'exerciseMinutes':
          return { mul: 0.4 };
        default:
          return NONE;
      }
    },
  }),
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];
