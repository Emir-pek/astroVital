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
  /**
   * Optional story-driven adherence (ADR-048): skip a data-entry slot or enter it late on a given
   * day. Slots: 'wake', 'am', 'glu', 'pm', 'ex', 'dose', 'mood'. Must be deterministic (fixed days).
   */
  adherence?(slot: string, ctx: ScenarioContext): SlotAdherence | undefined;
}

/** A missed (`skip`) or late (`delayMin` after the scheduled time) data entry. */
export interface SlotAdherence {
  skip?: boolean;
  delayMin?: number;
}

const NONE: ScenarioEffect = {};

/** Linear ramp 0→1 over the window [from, to] (inclusive), 0 before, 1 after. */
const ramp = (x: number, from: number, to: number): number =>
  x <= from ? 0 : x >= to ? 1 : (x - from) / (to - from);

/** Sums `add` and multiplies `mul` of several effects on the same metric. */
const combine = (...effects: ScenarioEffect[]): ScenarioEffect => {
  let add = 0;
  let mul = 1;
  for (const e of effects) {
    add += e.add ?? 0;
    mul *= e.mul ?? 1;
  }
  return { ...(add !== 0 ? { add } : {}), ...(mul !== 1 ? { mul } : {}) };
};

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

  /**
   * Default demo (ADR-038): one crew, four stories, four status levels at the same time.
   * crew-1 nominal · crew-2 warning (fever, with early signs) · crew-3 caution (isolation trend)
   * · crew-4 advisory (personal-baseline drift inside the population range). See DEMO_CREW_STORIES.md.
   */
  mixed_mission: scenario({
    id: 'mixed_mission',
    recommendedEnvironment: 'iss',
    effect: (metric, ctx) => {
      const { dayIndex, days, crewIndex } = ctx;
      const last = days - 1;
      switch (crewIndex) {
        case 1: {
          // Early signs (resting HR up, shorter sleep) 1–2 days before the fever ramp, then fever.
          const precursor = dayIndex >= last - MIXED.kenjiPrecursorDays + 1;
          const early: ScenarioEffect =
            precursor && metric === 'heartRate'
              ? { add: MIXED.kenjiPrecursorHr }
              : precursor && metric === 'sleepHours'
                ? { add: MIXED.kenjiPrecursorSleep }
                : NONE;
          return combine(early, SCENARIOS.fever_dehydration.effect(metric, ctx));
        }
        case 2: {
          const k = ramp(dayIndex, MIXED.selinStartDay, last);
          if (k === 0) return NONE;
          switch (metric) {
            case 'sleepHours':
              return { add: MIXED.selinSleep * k };
            case 'mood':
              return { add: MIXED.selinMood * k };
            case 'exerciseMinutes':
              return { add: MIXED.selinExercise * k };
            default:
              return NONE;
          }
        }
        case 3: {
          if (metric === 'systolicBP' && dayIndex > last - MIXED.lucasDriftDays)
            return { add: MIXED.lucasSystolic };
          if (
            metric === 'exerciseMinutes' &&
            (MIXED.lucasLowExerciseOffsets as readonly number[]).includes(last - dayIndex)
          )
            return { mul: MIXED.lucasLowExerciseMul };
          return NONE;
        }
        default:
          return NONE;
      }
    },
    // Adherence stories (DEMO_CREW_STORIES.md "Uyum"): days are fixed offsets from the last day.
    adherence: (slot, ctx) => {
      const offset = ctx.days - 1 - ctx.dayIndex; // 0 = last day (today)
      switch (ctx.crewIndex) {
        case 1: // Kenji: too ill to log exercise and evening mood; one morning block entered late
          if ((slot === 'ex' || slot === 'mood') && offset < MIXED.kenjiSkipLastDays)
            return { skip: true };
          if (slot === 'am' && offset === MIXED.kenjiLateMorningOffset)
            return { delayMin: MIXED.kenjiLateMorningDelayMin };
          return undefined;
        case 2: // Selin: fewer mood self-reports
          return slot === 'mood' &&
            (MIXED.selinSkipMoodOffsets as readonly number[]).includes(offset)
            ? { skip: true }
            : undefined;
        case 3: // Lucas: skipped exercise sessions
          return slot === 'ex' &&
            (MIXED.lucasSkipExerciseOffsets as readonly number[]).includes(offset)
            ? { skip: true }
            : undefined;
        default: // Mira: flawless
          return undefined;
      }
    },
  }),
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

/** Mixed-mission story constants (docs/DEMO_CREW_STORIES.md). Exported for tests. */
export const MIXED = {
  /** Kenji: early signs start this many days before the last day (fever ramp: last 3 days). */
  kenjiPrecursorDays: 5,
  kenjiPrecursorHr: 7,
  kenjiPrecursorSleep: -0.7,
  /** Selin: slow decline starts on this 0-based day (≈ mission day 10) and peaks on the last day. */
  selinStartDay: 9,
  selinSleep: -1.1,
  selinMood: -1.2,
  selinExercise: -40,
  /** Lucas: systolic drift over the last N days; exercise below target on 4 of the last 7 days. */
  lucasDriftDays: 10,
  lucasSystolic: 9,
  /** Offsets from the last day (0 = last day) with low exercise (≈ 70–90 min). */
  lucasLowExerciseOffsets: [6, 5, 4, 3],
  lucasLowExerciseMul: 0.6,
  // ── Adherence (offsets from the last day; avoid exercise rest days 7, 14, 21, 28 of 30) ──
  /** Kenji: no exercise / evening mood on the last N days (ill). */
  kenjiSkipLastDays: 2,
  /** Kenji: the morning vitals block of this day is entered after the grace window (late). */
  kenjiLateMorningOffset: 1,
  kenjiLateMorningDelayMin: 150,
  /** Selin: 3 evening mood reports missing in the last 10 days. */
  selinSkipMoodOffsets: [8, 5, 2],
  /**
   * Lucas: 2 exercise sessions missing in the last 7 days (days 25 and 27 of 30, both planned low days).
   * The last session before today (offset 1) stays recorded and normal, so his latest exercise value
   * — and his status — do not change during the day.
   */
  lucasSkipExerciseOffsets: [5, 3],
} as const;
